import { Sunrise, Sunset } from "lucide-react"

interface SunTimesProps {
  sunrise: string
  sunset: string
}

export function SunTimes({ sunrise, sunset }: SunTimesProps) {
  // Format time from "07:30" to "7:30 AM"
  function formatTime(time: string): string {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  return (
    <div className="flex items-center justify-between text-weather-secondary text-sm md:text-base font-mono">
      <div className="flex items-center gap-2">
        <Sunrise size={16} strokeWidth={1.5} className="text-weather-accent" />
        <span>{formatTime(sunrise)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Sunset size={16} strokeWidth={1.5} className="text-weather-accent" />
        <span>{formatTime(sunset)}</span>
      </div>
    </div>
  )
}
