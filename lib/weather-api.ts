import type { WeatherData } from "./mock-weather-data"

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

function getWeatherCondition(weatherCode: number): "clear" | "cloudy" | "rain" | "snow" | "partly-cloudy" {
  if (weatherCode === 0) return "clear"
  if (weatherCode === 1 || weatherCode === 2) return "partly-cloudy"
  if (weatherCode === 3 || weatherCode === 45 || weatherCode === 48) return "cloudy"
  if (weatherCode >= 51 && weatherCode <= 67) return "rain"
  if (weatherCode >= 71 && weatherCode <= 77) return "snow"
  if (weatherCode >= 80 && weatherCode <= 82) return "rain"
  if (weatherCode >= 85 && weatherCode <= 86) return "snow"
  return "partly-cloudy"
}

export async function fetchWeatherData(location: string): Promise<WeatherData> {
  const coords = LOCATION_COORDS[location]

  if (!coords) {
    throw new Error(`Unknown location: ${location}`)
  }

  // Get today's date and yesterday's date
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = today.toISOString().split("T")[0]
  const yesterdayStr = yesterday.toISOString().split("T")[0]

  try {
    // Fetch today's forecast with daily sunrise/sunset
    const todayResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=temperature_2m,apparent_temperature,weather_code&daily=sunrise,sunset&timezone=auto&forecast_days=1`,
    )

    // Fetch yesterday's data from archive
    const yesterdayResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=temperature_2m,weather_code&timezone=auto&start_date=${yesterdayStr}&end_date=${yesterdayStr}`,
    )

    if (!todayResponse.ok || !yesterdayResponse.ok) {
      throw new Error("Failed to fetch weather data")
    }

    const todayData = await todayResponse.json()
    const yesterdayData = await yesterdayResponse.json()

    const currentHour = today.getHours()
    const currentTemp = todayData.hourly.temperature_2m[currentHour]
    const feelsLikeTemp = todayData.hourly.apparent_temperature[currentHour]
    const currentCondition = getWeatherCondition(todayData.hourly.weather_code[currentHour])

    // Parse sunrise/sunset times (format: "2024-01-15T07:30" -> "07:30")
    const sunrise = todayData.daily.sunrise[0].split("T")[1]
    const sunset = todayData.daily.sunset[0].split("T")[1]

    // Calculate averages for comparison
    const todayTemps = todayData.hourly.temperature_2m.slice(0, 24)
    const yesterdayTemps = yesterdayData.hourly.temperature_2m.slice(0, 24)

    const todayAvgTemp = todayTemps.reduce((a: number, b: number) => a + b, 0) / todayTemps.length
    const yesterdayAvgTemp = yesterdayTemps.reduce((a: number, b: number) => a + b, 0) / yesterdayTemps.length

    // Get temperature and conditions for specific periods
    const periods = [
      {
        time: "Morning",
        hour: 6,
      },
      {
        time: "Noon",
        hour: 12,
      },
      {
        time: "Evening",
        hour: 18,
      },
      {
        time: "Night",
        hour: 0,
      },
    ]

    const weatherPeriods = periods.map((period) => ({
      time: period.time,
      temp: Math.round(todayData.hourly.temperature_2m[period.hour]),
      condition: getWeatherCondition(todayData.hourly.weather_code[period.hour]),
      yesterdayTemp: Math.round(yesterdayData.hourly.temperature_2m[period.hour]),
    }))

    return {
      location,
      timezone: coords.timezone,
      currentTemp: Math.round(currentTemp),
      feelsLikeTemp: Math.round(feelsLikeTemp),
      currentCondition,
      yesterdayAvgTemp: Math.round(yesterdayAvgTemp),
      todayAvgTemp: Math.round(todayAvgTemp),
      periods: weatherPeriods,
      sunrise,
      sunset,
      lastUpdated: new Date(),
    }
  } catch (error) {
    console.error("[v0] Error fetching weather data:", error)
    throw error
  }
}
