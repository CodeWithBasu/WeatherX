import type { WeatherData } from "./mock-weather-data"

export function getComparisonText(todayTemp: number, yesterdayTemp: number): string {
  const diff = todayTemp - yesterdayTemp

  if (Math.abs(diff) <= 2) {
    return "About the same as yesterday"
  } else if (diff > 10) {
    return "Much warmer than yesterday"
  } else if (diff > 2) {
    return "Warmer than yesterday"
  } else if (diff < -10) {
    return "Much colder than yesterday"
  } else {
    return "Cooler than yesterday"
  }
}

export function getComparisonIndicator(todayTemp: number, yesterdayTemp: number): string {
  const diff = todayTemp - yesterdayTemp

  if (Math.abs(diff) <= 2) {
    return "≈"
  } else if (diff > 0) {
    return "↑"
  } else {
    return "↓"
  }
}

export function getSecondaryText(data: WeatherData): string {
  const diff = data.todayAvgTemp - data.yesterdayAvgTemp
  const absDiff = Math.abs(diff)

  if (absDiff <= 2) {
    return "Temperatures holding steady through the day."
  } else if (diff > 0) {
    return `About ${absDiff}° warmer on average.`
  } else {
    return `About ${absDiff}° cooler on average.`
  }
}

export function getConditionText(condition: string): string {
  const conditions: Record<string, string> = {
    clear: "Clear skies",
    cloudy: "Overcast",
    rain: "Rain expected",
    snow: "Snow likely",
    "partly-cloudy": "Partly cloudy",
  }
  return conditions[condition] || condition
}

export function formatTime(date: Date, timezone?: string): string {
  return date
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone,
    })
    .toLowerCase()
}

export function formatDate(date: Date, timezone?: string): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  })
}
