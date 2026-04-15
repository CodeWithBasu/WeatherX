export interface WeatherPeriod {
  time: string
  temp: number
  condition: "clear" | "cloudy" | "rain" | "snow" | "partly-cloudy"
  yesterdayTemp: number
}

export interface WeatherData {
  location: string
  timezone: string
  currentTemp: number
  feelsLikeTemp: number
  currentCondition: "clear" | "cloudy" | "rain" | "snow" | "partly-cloudy"
  yesterdayAvgTemp: number
  todayAvgTemp: number
  periods: WeatherPeriod[]
  sunrise: string
  sunset: string
  lastUpdated: Date
  lat: number
  lon: number
}

export function getMockWeatherData(): WeatherData {
  return {
    location: "Brooklyn, NY",
    timezone: "America/New_York",
    currentTemp: 42,
    feelsLikeTemp: 38,
    currentCondition: "partly-cloudy",
    yesterdayAvgTemp: 45,
    todayAvgTemp: 43,
    periods: [
      { time: "Morning", temp: 38, condition: "cloudy", yesterdayTemp: 40 },
      { time: "Noon", temp: 45, condition: "partly-cloudy", yesterdayTemp: 48 },
      { time: "Evening", temp: 42, condition: "clear", yesterdayTemp: 44 },
      { time: "Night", temp: 36, condition: "clear", yesterdayTemp: 38 },
    ],
    sunrise: "06:45",
    sunset: "17:30",
    lastUpdated: new Date(),
    lat: 40.6782,
    lon: -73.9442,
  }
}
