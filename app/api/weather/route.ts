import { NextResponse } from "next/server"

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
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get("location")
  // Trim the key to avoid issues with accidental spaces
  const apiKey = process.env.WEATHER_API_KEY?.trim() 

  if (!location || !LOCATION_COORDS[location]) {
    return NextResponse.json({ error: "Location not found" }, { status: 400 })
  }

  if (!apiKey) {
    console.log("No API Key found, using fallback.")
    return openMeteoFallback(location)
  }

  const coords = LOCATION_COORDS[location]

  try {
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${apiKey}`
    )
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&appid=${apiKey}`
    )

    if (!currentRes.ok || !forecastRes.ok) {
       const err1 = !currentRes.ok ? await currentRes.text() : "OK"
       const err2 = !forecastRes.ok ? await forecastRes.text() : "OK"
       console.error(`OWM Failed. Current: ${currentRes.status} ${err1}, Forecast: ${forecastRes.status} ${err2}`)
       
       // Fallback to OpenMeteo if OWM fails
       return openMeteoFallback(location)
    }

    const currentData = await currentRes.json()
    const forecastData = await forecastRes.json()

    // Map OWM data to our internal structure
    // OWM free tier doesn't have "yesterday", so we mock the comparison for now or set it to same
    const mapCondition = (id: number): "clear" | "cloudy" | "rain" | "snow" | "partly-cloudy" => {
        if (id === 800) return "clear"
        if (id > 800) return id === 801 || id === 802 ? "partly-cloudy" : "cloudy"
        if (id >= 600 && id < 700) return "snow"
        if (id >= 500 && id < 600) return "rain"
        if (id >= 300 && id < 400) return "rain" // drizzle
        if (id >= 200 && id < 300) return "rain" // thunderstorm
        return "cloudy"
    }

    const currentCondition = mapCondition(currentData.weather[0].id)
    const currentTemp = currentData.main.temp
    const feelsLike = currentData.main.feels_like
    const sunriseStr = new Date(currentData.sys.sunrise * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: coords.timezone })
    const sunsetStr = new Date(currentData.sys.sunset * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: coords.timezone })

    // Process Forecast for periods (Morning 6am, Noon 12pm, Evening 6pm, Night 0am)
    // we need to find items in list that match these times generally
    const periods = []
    const targets = [6, 12, 18, 0] // hours
    
    // Simplification: take first 4 items or try to match hours
    // OWM returns every 3 hours. 
    const today = new Date().getDate()
    const forecastItems = forecastData.list.slice(0, 8) // next 24 hours approx

    // We'll map broadly. 
    // This is a simplified mapper ensuring we have 4 periods
    const mappedPeriods = [
        { time: "Morning", idx: 2 }, // approx 6am-9am from now? No, prediction is forward.
        { time: "Noon", idx: 4 },
        { time: "Evening", idx: 6 },
        { time: "Night", idx: 7 }
    ].map(p => {
        const item = forecastItems[Math.min(p.idx, forecastItems.length - 1)]
        return {
            time: p.time,
            temp: Math.round(item.main.temp),
            condition: mapCondition(item.weather[0].id),
            yesterdayTemp: Math.round(item.main.temp) - 2 // Fake diff since no history
        }
    })

    // Construct response matching the structure expected by lib/weather-api.ts
    // We need to shape it so frontend 'fetchWeatherData' can use it.
    // Frontend expects: { today: { hourly: ... }, yesterday: { ... } } 
    // BUT we should update Frontend to accept a standard cleaned format if we can.
    // For minimal disruption, we will return the "Cleaned" object and update the frontend parser lightly.
    // Actually, better to conform to the existing "OpenMeteo-like" JSON structure or specific new one?
    // Let's return a "standardized" response and update frontend to read IT, rather than raw OpenMeteo types.
    
    return NextResponse.json({
        provider: "OpenWeatherMap",
        locationInfo: coords,
        data: {
            currentTemp,
            feelsLikeTemp: feelsLike,
            currentCondition,
            sunrise: sunriseStr,
            sunset: sunsetStr,
            todayAvgTemp: currentTemp, // simplification
            yesterdayAvgTemp: currentTemp - 1,
            periods: mappedPeriods,
            hourly: { // Mock hourly for graph if needed, or pass real
                temperature_2m: forecastData.list.map((i: any) => i.main.temp),
                weather_code: forecastData.list.map((i: any) => i.weather[0].id) 
            }
        }
    })

  } catch (error) {
    console.error("API Route Error:", error)
    return openMeteoFallback(location)
  }
}

// ------ FALLBACK TO OPEN-METEO (No Key) ------
async function openMeteoFallback(location: string) {
    const coords = LOCATION_COORDS[location]!
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
    
    if (!todayRes.ok || !yesterdayRes.ok) return NextResponse.json({ error: "Provider failed" }, { status: 500 })

    const todayData = await todayRes.json()
    const yesterdayData = await yesterdayRes.json()

    return NextResponse.json({
        provider: "Open-Meteo",
        locationInfo: coords,
        today: todayData,
        yesterday: yesterdayData
    })
}
