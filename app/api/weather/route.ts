import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic";

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
  try {
    const { searchParams } = new URL(request.url)
  let location = searchParams.get("location")
  const apiKey = process.env.WEATHER_API_KEY?.trim()
  const oikolabKey = process.env.OIKOLAB_API_KEY?.trim()

  let coords: LocationCoordinates | null = null

  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")
  const tz = searchParams.get("timezone")

  if (lat && lon) {
    let resolvedTimezone = tz || "UTC";
    let humanLocation = location;

    // Resolve 'auto' timezone if provided
    if (resolvedTimezone === "auto") {
      try {
        const tzRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto`);
        if (tzRes.ok) {
           const tzData = await tzRes.json();
           if (tzData.timezone) resolvedTimezone = tzData.timezone;
        }
      } catch (err) {
        console.error("Coordinate Timezone resolution failed:", err);
      }
    }

    // Attempt to get a human-readable name for these coordinates (Reverse Geocoding)
    if (!location || location.includes(',')) {
       try {
          if (apiKey) {
            const revRes = await fetch(`http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`);
            if (revRes.ok) {
              const revData = await revRes.json();
              if (revData && revData.length > 0) {
                humanLocation = `${revData[0].name}, ${revData[0].country}`;
              }
            }
          }
       } catch (err) {
         console.error("Reverse geocoding failed:", err);
       }
    }

    coords = { 
      lat: parseFloat(lat), 
      lon: parseFloat(lon), 
      timezone: resolvedTimezone 
    }
    // Update location name for the rest of the flow
    if (humanLocation) location = humanLocation;
  } else if (location && LOCATION_COORDS[location]) {
    coords = LOCATION_COORDS[location]
  } else if (location) {
    // If not in hardcoded list and no coords provided, try to geocode!
    try {
      const cityOnly = location.split(',')[0].trim()
      let found = false;

      // 1. Try Open-Meteo Geocoding
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityOnly)}&count=1&language=en&format=json`)
      if (geoRes.ok) {
        const geoData = await geoRes.json()
        if (geoData.results && geoData.results.length > 0) {
          const res = geoData.results[0]
          coords = {
            lat: res.latitude,
            lon: res.longitude,
            timezone: res.timezone || "UTC"
          }
          found = true;
        }
      }

      // 2. Try OpenWeatherMap Geocoding Fallback if Open-Meteo failed
      if (!found && apiKey) {
        const owmRes = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityOnly)}&limit=1&appid=${apiKey}`)
        if (owmRes.ok) {
           const owmData = await owmRes.json()
           if (owmData && owmData.length > 0) {
             const res = owmData[0]
             
             // OWM doesn't immediately yield a timezone strictly, so we bounce a lightweight query to OpenMeteo to resolve the IANA time string for local frontend date display
             let resolvedTimezone = "UTC";
             try {
                const tzRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${res.lat}&longitude=${res.lon}&timezone=auto`);
                if (tzRes.ok) {
                   const tzData = await tzRes.json();
                   if (tzData.timezone) resolvedTimezone = tzData.timezone;
                }
             } catch(e) {
                // Ignore gracefully
             }

             coords = {
               lat: res.lat,
               lon: res.lon,
               timezone: resolvedTimezone
             }
             found = true;
           }
        }
      }
    } catch (e) {
      console.error("Geocoding failed for:", location, e)
    }
  }

    if (!coords && location) {
      // 3. Last Resort: Detect if location string itself contains coordinates "lat, lon"
      const coordMatch = location.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
      if (coordMatch) {
         coords = {
           lat: parseFloat(coordMatch[1]),
           lon: parseFloat(coordMatch[2]),
           timezone: "UTC"
         };
         console.log("Detected coordinates in location string:", coords);
      }
    }

    if (!coords) {
      console.error("DEBUG: Failed to resolve coords for location:", location, "params:", {lat, lon});
      return NextResponse.json(
        { error: `Unable to locate "${location || 'unknown'}". Please try a city name or coordinates.` },
        { status: 400 }
      )
    }

  // Use a unique key for caching (location name or lat,lon)
  const cacheKey = location || `${coords.lat},${coords.lon}`
  
  // Log search history in background
  prisma.searchHistory.create({ data: { query: cacheKey } }).catch((err) => console.error("Failed to log search history:", err))

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
  } catch (error: any) {
    console.error("CRITICAL API ERROR:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
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

    // Oikolab API query building
    const params = "param=temperature&param=total_cloud_cover&param=wind_speed&param=apparent_temperature";
    const url = `https://api.oikolab.com/weather?lat=${coords.lat}&lon=${coords.lon}&${params}&start=${start.toISOString().split('T')[0]}&end=${end.toISOString().split('T')[0]}`;
    
    // Explicitly pass api-key as an HTTP header
    const res = await fetch(url, { headers: { "api-key": apiKey } });
    if (!res.ok) {
        const errVal = await res.text();
        throw new Error(`Oikolab error: ${res.status} ${errVal}`);
    }
    const oiko = await res.json();
    
    // Oikolab returns a stringified Pandas DataFrame in `data` field
    const d = JSON.parse(oiko.data);
    
    // Find column indices
    const tempColIdx = d.columns.findIndex((c: string) => c.includes("temperature") && !c.includes("apparent"));
    const cloudColIdx = d.columns.findIndex((c: string) => c.includes("total_cloud_cover"));
    const windColIdx = d.columns.findIndex((c: string) => c.includes("wind_speed"));
    const feelsColIdx = d.columns.findIndex((c: string) => c.includes("apparent_temperature"));

    // Function to get the closest hour data
    const getAtHour = (targetDate: Date, targetHour: number) => {
        const dTarget = new Date(targetDate);
        dTarget.setHours(targetHour, 0, 0, 0);
        const targetTs = Math.floor(dTarget.getTime() / 1000);
        
        let closestIdx = -1;
        let minDiff = Infinity;
        for (let i = 0; i < d.index.length; i++) {
            const diff = Math.abs(d.index[i] - targetTs);
            if (diff < minDiff) {
                minDiff = diff;
                closestIdx = i;
            }
        }
        return closestIdx !== -1 ? d.data[closestIdx] : null;
    }

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const mapCondition = (cloudFraction: number | null | undefined): "clear" | "cloudy" | "partly-cloudy" => {
        if (cloudFraction == null) return "clear";
        if (cloudFraction > 0.8) return "cloudy";
        if (cloudFraction > 0.3) return "partly-cloudy";
        return "clear";
    }

    const periods = ["Morning", "Noon", "Evening", "Night"].map((name, i) => {
        const hour = [6, 12, 18, 0][i];
        const tData = getAtHour(today, hour);
        const yData = getAtHour(yesterday, hour);
        
        return {
            time: name,
            temp: Math.round((tData && tempColIdx !== -1 ? tData[tempColIdx] : 0)),
            condition: mapCondition(tData && cloudColIdx !== -1 ? tData[cloudColIdx] : 0),
            yesterdayTemp: Math.round((yData && tempColIdx !== -1 ? yData[tempColIdx] : 0))
        }
    });

    // Averages
    const todayTargetStart = Math.floor(new Date(today.setHours(0,0,0,0)).getTime() / 1000);
    const todayTargetEnd = todayTargetStart + 86400;
    const yesterdayTargetStart = todayTargetStart - 86400;

    let todayTempSum = 0;
    let todayTempCount = 0;
    let yesterdayTempSum = 0;
    let yesterdayTempCount = 0;
    
    for (let i = 0; i < d.index.length; i++) {
        const ts = d.index[i];
        const temp = d.data[i][tempColIdx];
        if (ts >= todayTargetStart && ts < todayTargetEnd) {
            todayTempSum += temp;
            todayTempCount++;
        } else if (ts >= yesterdayTargetStart && ts < todayTargetStart) {
            yesterdayTempSum += temp;
            yesterdayTempCount++;
        }
    }

    const todayAvg = todayTempCount ? todayTempSum / todayTempCount : 0;
    const yesterdayAvg = yesterdayTempCount ? yesterdayTempSum / yesterdayTempCount : 0;
    
    // Current Data
    const currentDate = new Date();
    const currentDataRow = getAtHour(currentDate, currentDate.getHours());
    const currentTemp = currentDataRow && tempColIdx !== -1 ? currentDataRow[tempColIdx] : 0;
    const currentFeels = currentDataRow && feelsColIdx !== -1 ? currentDataRow[feelsColIdx] : currentTemp;
    const currentClouds = currentDataRow && cloudColIdx !== -1 ? currentDataRow[cloudColIdx] : 0;

    // Fetch Sunrise/Sunset from Open-Meteo as Oikolab query currently doesn't include it
    let sunrise = "--:--"
    let sunset = "--:--"
    try {
        const astroRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=sunrise,sunset&timezone=auto&forecast_days=1`, { cache: "no-store" })
        if (astroRes.ok) {
            const astroData = await astroRes.json()
            if (astroData.daily && astroData.daily.sunrise && astroData.daily.sunrise[0]) {
                // Open-Meteo returns "2024-04-15T05:29"
                sunrise = astroData.daily.sunrise[0].split("T")[1];
                sunset = astroData.daily.sunset[0].split("T")[1];
                console.log(`Astronomical data fetched: Sunrise ${sunrise}, Sunset ${sunset}`);
            } else {
                console.warn("Astronomical data empty for coords:", coords);
            }
        } else {
            console.error("Astronomical API error:", astroRes.status);
        }
    } catch (e) {
        console.error("Failed to fetch astronomical data:", e)
    }

    return {
        provider: "Oikolab",
        locationInfo: coords,
        data: {
            currentTemp: currentTemp,
            feelsLikeTemp: currentFeels,
            currentCondition: mapCondition(currentClouds),
            sunrise: sunrise, 
            sunset: sunset,
            todayAvgTemp: todayAvg,
            yesterdayAvgTemp: yesterdayAvg,
            periods,
            hourly: {
                temperature_2m: d.data.map((row: any) => row[tempColIdx]),
                weather_code: d.data.map((row: any) => (row[cloudColIdx] > 0.5 ? 3 : 0)) 
            }
        }
    }
}
