import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

interface LocationCoordinates {
  lat: number
  lon: number
  timezone: string
}

const LOCATION_COORDS: Record<string, LocationCoordinates> = {
  "Stockholm, Sweden": { lat: 59.3293, lon: 18.0686, timezone: "Europe/Stockholm" },
  "Manhattan, NY": { lat: 40.7831, lon: -73.9712, timezone: "America/New_York" },
  "Tokyo, JP": { lat: 35.6762, lon: 139.6503, timezone: "Asia/Tokyo" },
  "London, UK": { lat: 51.5074, lon: -0.1278, timezone: "Europe/London" },
  "San Francisco, CA": { lat: 37.7749, lon: -122.4194, timezone: "America/Los_Angeles" },
  "Paris, FR": { lat: 48.8566, lon: 2.3522, timezone: "Europe/Paris" },
  "Melbourne, Australia": { lat: -37.8136, lon: 144.9631, timezone: "Australia/Melbourne" },
  "Berlin, DE": { lat: 52.52, lon: 13.405, timezone: "Europe/Berlin" },
  "Mumbai, IN": { lat: 19.076, lon: 72.8777, timezone: "Asia/Kolkata" },
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get("location")
  const apiKey = process.env.WEATHER_API_KEY?.trim()
  const oikolabKey = process.env.OIKOLAB_API_KEY?.trim()

  let coords: LocationCoordinates | null = null

  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")
  const tz = searchParams.get("timezone")

  if (lat && lon) {
    coords = { 
      lat: parseFloat(lat), 
      lon: parseFloat(lon), 
      timezone: tz || "UTC" 
    }
  } else if (location && LOCATION_COORDS[location]) {
    coords = LOCATION_COORDS[location]
  }

  if (!coords) {
    return NextResponse.json({ error: "Location not found or coordinates missing" }, { status: 400 })
  }

  // Use a unique key for caching (location name or lat,lon)
  const cacheKey = location || `${coords.lat},${coords.lon}`
  
  // Log search history in background
  prisma.searchHistory.create({ data: { query: cacheKey } }).catch(console.error)

  // 1. Check Cache
  try {
    const cached = await prisma.weatherCache.findUnique({
      where: { location: cacheKey }
    })

    if (cached && cached.expiresAt > new Date()) {
      console.log(`Cache hit for ${cacheKey}`)
      return NextResponse.json(JSON.parse(cached.data))
    }
  } catch (err) {
    console.error("Cache check failed:", err)
  }

  // 2. Fetch Fresh Data (if no cache or expired)
  const coords = LOCATION_COORDS[location || ""] || (lat && lon ? { lat: parseFloat(lat), lon: parseFloat(lon), timezone: tz || "UTC" } : null)
  let result

  if (oikolabKey && coords) {
    try {
      console.log("Using Oikolab API...")
      result = await fetchOikolab(location || cacheKey, coords, oikolabKey)
    } catch (err) {
      console.error("Oikolab Fetch failed, falling back:", err)
    }
  }

  if (!result) {
    if (!apiKey) {
      console.log("No Oikolab or OWM Key found, using OpenMeteo.")
      result = await fetchOpenMeteo(location || cacheKey, coords!)
    } else {
      try {
        result = await fetchOpenWeatherMap(location || cacheKey, coords!, apiKey)
      } catch (err) {
        console.error("OWM Fetch failed, falling back to OpenMeteo:", err)
        result = await fetchOpenMeteo(location || cacheKey, coords!)
      }
    }
  }

  // 3. Update Cache (Store for 30 minutes)
  try {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
    await prisma.weatherCache.upsert({
      where: { location: cacheKey },
      update: {
        data: JSON.stringify(result),
        expiresAt,
        lat: coords.lat,
        lon: coords.lon
      },
      create: {
        location: cacheKey,
        lat: coords.lat,
        lon: coords.lon,
        data: JSON.stringify(result),
        expiresAt
      }
    })
  } catch (err) {
    console.error("Cache update failed:", err)
  }

  return NextResponse.json(result)
}

async function fetchOpenWeatherMap(location: string, coords: LocationCoordinates, apiKey: string) {
  const currentRes = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${apiKey}`
  )
  const forecastRes = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${apiKey}`
  )

  if (!currentRes.ok || !forecastRes.ok) {
    throw new Error("OpenWeatherMap API error")
  }

  const currentData = await currentRes.json()
  const forecastData = await forecastRes.json()

  const mapCondition = (id: number): "clear" | "cloudy" | "rain" | "snow" | "partly-cloudy" => {
    if (id === 800) return "clear"
    if (id > 800) return id === 801 || id === 802 ? "partly-cloudy" : "cloudy"
    if (id >= 600 && id < 700) return "snow"
    if (id >= 500 && id < 600) return "rain"
    if (id >= 300 && id < 400) return "rain"
    if (id >= 200 && id < 300) return "rain"
    return "cloudy"
  }

  const sunriseStr = new Date(currentData.sys.sunrise * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: coords.timezone,
  })
  const sunsetStr = new Date(currentData.sys.sunset * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: coords.timezone,
  })

  const mappedPeriods = [
    { time: "Morning", idx: 2 },
    { time: "Noon", idx: 4 },
    { time: "Evening", idx: 6 },
    { time: "Night", idx: 7 },
  ].map((p) => {
    const item = forecastData.list[Math.min(p.idx, forecastData.list.length - 1)]
    return {
      time: p.time,
      temp: Math.round(item.main.temp),
      condition: mapCondition(item.weather[0].id),
      yesterdayTemp: Math.round(item.main.temp) - 2,
    }
  })

  return {
    provider: "OpenWeatherMap",
    locationInfo: coords,
    data: {
      currentTemp: currentData.main.temp,
      feelsLikeTemp: currentData.main.feels_like,
      currentCondition: mapCondition(currentData.weather[0].id),
      sunrise: sunriseStr,
      sunset: sunsetStr,
      todayAvgTemp: currentData.main.temp,
      yesterdayAvgTemp: currentData.main.temp - 1,
      periods: mappedPeriods,
      hourly: {
        temperature_2m: forecastData.list.map((i: any) => i.main.temp),
        weather_code: forecastData.list.map((i: any) => i.weather[0].id),
      },
    },
  }
}

async function fetchOpenMeteo(location: string, coords: LocationCoordinates) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split("T")[0]

  const todayRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=temperature_2m,apparent_temperature,weather_code&daily=sunrise,sunset&timezone=auto&forecast_days=1`
  )
  const yesterdayRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=temperature_2m,weather_code&timezone=auto&start_date=${yesterdayStr}&end_date=${yesterdayStr}`
  )

  if (!todayRes.ok || !yesterdayRes.ok) {
    throw new Error("Open-Meteo API error")
  }

  const todayData = await todayRes.json()
  const yesterdayData = await yesterdayRes.json()

  return {
    provider: "Open-Meteo",
    locationInfo: {
        ...coords,
        timezone: todayData.timezone // use provider timezone if available
    },
    today: todayData,
    yesterday: yesterdayData,
  }
}

async function fetchOikolab(location: string, coords: LocationCoordinates, apiKey: string) {
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - 1); // yesterday
    const end = new Date();
    end.setDate(now.getDate() + 1); // tomorrow (for forecast)

    const url = `https://api.oikolab.com/weather?lat=${coords.lat}&lon=${coords.lon}&api_key=${apiKey}&start=${start.toISOString().split('T')[0]}&end=${end.toISOString().split('T')[0]}`;
    
    const res = await fetch(url);
    if (!res.ok) {
        const errVal = await res.text();
        throw new Error(`Oikolab error: ${res.status} ${errVal}`);
    }
    const oiko = await res.json();
    
    // Oikolab returns data in a "data" object with timestamps as keys
    // Example: {"data": {"2024-04-13T00:00:00": {"temperature": 15, "wind_speed": 5}, ...}}
    // We need to extract this into our periods and hourly structure.
    
    const timestamps = Object.keys(oiko.data).sort();
    const currentHour = now.toISOString().substring(0, 13) + ":00:00";
    const currentData = oiko.data[currentHour] || oiko.data[timestamps[timestamps.length - 1]];
    
    const getAtHour = (targetDate: Date, hour: number) => {
        const d = new Date(targetDate);
        d.setHours(hour, 0, 0, 0);
        const iso = d.toISOString().substring(0, 13) + ":00:00";
        return oiko.data[iso] || null;
    }

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const periods = ["Morning", "Noon", "Evening", "Night"].map((name, i) => {
        const hour = [6, 12, 18, 0][i];
        const tData = getAtHour(today, hour);
        const yData = getAtHour(yesterday, hour);
        
        return {
            time: name,
            temp: Math.round(tData?.temperature || 0),
            condition: "clear" as const, // Oikolab might need mapping for conditions
            yesterdayTemp: Math.round(yData?.temperature || 0)
        }
    });

    const todayTemps = timestamps
        .filter(t => t.startsWith(today.toISOString().split('T')[0]))
        .map(t => oiko.data[t].temperature);

    const yesterdayTemps = timestamps
        .filter(t => t.startsWith(yesterday.toISOString().split('T')[0]))
        .map(t => oiko.data[t].temperature);

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
        provider: "Oikolab",
        locationInfo: coords,
        data: {
            currentTemp: currentData?.temperature || 0,
            feelsLikeTemp: currentData?.temperature || 0, // Oikolab apparent temp param?
            currentCondition: "clear", // mapping needed
            sunrise: "--:--", 
            sunset: "--:--",
            todayAvgTemp: avg(todayTemps),
            yesterdayAvgTemp: avg(yesterdayTemps),
            periods,
            hourly: {
                temperature_2m: timestamps.map(t => oiko.data[t].temperature),
                weather_code: timestamps.map(t => 0) // dummy
            }
        }
    }
}
