"use client"

import type { WeatherData } from "./mock-weather-data"

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

export async function fetchWeatherData(
  location: string, 
  coords?: { lat: number; lon: number; timezone: string }
): Promise<WeatherData> {
  try {
    let url = `/api/weather?location=${encodeURIComponent(location)}`
    if (coords) {
      url += `&lat=${coords.lat}&lon=${coords.lon}&timezone=${encodeURIComponent(coords.timezone)}`
    }
    
    const response = await fetch(url)
    const result = await response.json().catch(() => ({}))
    
    if (!response.ok) {
      throw new Error(result.error || "Failed to fetch weather data from backend")
    }

    // Modern provider data format (Oikolab, OWM)
    if (result.data) {
        const d = result.data
        return {
          location: location.includes(",") ? location : (d.location || location),
          timezone: result.locationInfo?.timezone || "UTC",
          currentTemp: Math.round(d.currentTemp),
          feelsLikeTemp: Math.round(d.feelsLikeTemp),
          currentCondition: d.currentCondition,
          yesterdayAvgTemp: Math.round(d.yesterdayAvgTemp),
          todayAvgTemp: Math.round(d.todayAvgTemp),
          periods: d.periods || [],
          sunrise: d.sunrise,
          sunset: d.sunset,
          lastUpdated: new Date(),
          lat: result.locationInfo?.lat || 0,
          lon: result.locationInfo?.lon || 0,
        }
    }

    // Fallback: Handle raw Open-Meteo format
    if (!result.today || !result.yesterday) {
       throw new Error("Invalid data format received from backend")
    }

    const { today, yesterday, locationInfo } = result

    const currentHour = new Date().getHours()
    const todayTemps = today.hourly.temperature_2m
    const yesterdayTemps = yesterday.hourly.temperature_2m
    
    const currentTemp = todayTemps[currentHour]
    const feelsLikeTemp = today.hourly.apparent_temperature[currentHour]
    const currentCondition = getWeatherCondition(today.hourly.weather_code[currentHour])

    const sunrise = today.daily.sunrise[0].split("T")[1]
    const sunset = today.daily.sunset[0].split("T")[1]

    const todaySlice = todayTemps.slice(0, 24)
    const yesterdaySlice = yesterdayTemps.slice(0, 24)
    
    const todayAvg = todaySlice.reduce((a: number, b: number) => a + b, 0) / todaySlice.length
    const yesterdayAvg = yesterdaySlice.reduce((a: number, b: number) => a + b, 0) / yesterdaySlice.length

    const periods = [
      { time: "Morning", hour: 6 },
      { time: "Noon", hour: 12 },
      { time: "Evening", hour: 18 },
      { time: "Night", hour: 0 }
    ]

    const weatherPeriods = periods.map((period) => ({
      time: period.time,
      temp: Math.round(todayTemps[period.hour]),
      condition: getWeatherCondition(today.hourly.weather_code[period.hour]),
      yesterdayTemp: Math.round(yesterdayTemps[period.hour]),
    }))

    return {
      location,
      timezone: locationInfo.timezone,
      currentTemp: Math.round(currentTemp),
      feelsLikeTemp: Math.round(feelsLikeTemp),
      currentCondition,
      yesterdayAvgTemp: Math.round(yesterdayAvg),
      todayAvgTemp: Math.round(todayAvg),
      periods: weatherPeriods,
      sunrise,
      sunset,
      lastUpdated: new Date(),
      lat: locationInfo.lat,
      lon: locationInfo.lon,
    }

  } catch (error) {
    console.error("Error fetching weather:", error)
    throw error
  }
}

export async function searchLocations(query: string) {
  if (query.length < 2) return []
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
    if (!res.ok) throw new Error("Search failed")
    const data = await res.json()
    return data.results || []
  } catch (err) {
    console.error("Search error:", err)
    return []
  }
}
