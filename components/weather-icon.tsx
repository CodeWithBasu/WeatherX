import { Sun, Cloud, CloudRain, CloudSnow, CloudSun } from "lucide-react"

interface WeatherIconProps {
  condition: "clear" | "cloudy" | "rain" | "snow" | "partly-cloudy"
  size?: number
}

export function WeatherIcon({ condition, size = 24 }: WeatherIconProps) {
  const strokeWidth = 1.5

  switch (condition) {
    case "clear":
      return <Sun size={size} strokeWidth={strokeWidth} />
    case "cloudy":
      return <Cloud size={size} strokeWidth={strokeWidth} />
    case "rain":
      return <CloudRain size={size} strokeWidth={strokeWidth} />
    case "snow":
      return <CloudSnow size={size} strokeWidth={strokeWidth} />
    case "partly-cloudy":
      return <CloudSun size={size} strokeWidth={strokeWidth} />
    default:
      return null
  }
}
