"use client"

import { useState, useEffect } from "react"
import { Settings } from "lucide-react"
import { formatTime, formatDate } from "@/lib/weather-utils"

interface WeatherHeaderProps {
  location: string
  timezone: string
  onSettingsClick: () => void
}

export function WeatherHeader({ location, timezone, onSettingsClick }: WeatherHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="flex items-start justify-between">
      <div className="space-y-1 md:space-y-2">
        <p className="text-weather-secondary text-sm md:text-base">
          {formatDate(currentTime, timezone)} · {formatTime(currentTime, timezone)}
        </p>
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="X" className="w-5 h-5 md:w-6 md:h-6 object-contain opacity-80 animate-logo-float" />
          <h1 className="text-weather-primary text-lg md:text-xl lg:text-2xl">{location}</h1>
        </div>
      </div>
      <button
        onClick={onSettingsClick}
        className="p-2 -m-2 text-weather-accent hover:text-weather-primary transition-colors duration-300 lg:hidden"
        aria-label="Settings"
      >
        <Settings size={20} className="md:w-6 md:h-6" strokeWidth={1.5} />
      </button>
    </header>
  )
}
