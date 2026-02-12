"use client"

import { useState, useEffect } from "react"
import { WeatherHeader } from "@/components/weather-header"
import { WeatherSummary } from "@/components/weather-summary"
import { WeatherGrid } from "@/components/weather-grid"
import { SunTimes } from "@/components/sun-times"
import { SettingsPanel } from "@/components/settings-panel"
import { WeatherParticles } from "@/components/weather-particles"
import { fetchWeatherData } from "@/lib/weather-api"
import type { WeatherData } from "@/lib/mock-weather-data"

export default function WeatherPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [unit, setUnit] = useState<"C" | "F">("C")
  const [location, setLocation] = useState("Stockholm, Sweden")
  const [locations, setLocations] = useState([
    "San Francisco, CA",
    "Manhattan, NY",
    "London, UK",
    "Paris, FR",
    "Stockholm, Sweden",
    "Tokyo, JP",
    "Melbourne, Australia",
  ])
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [isLoadingWeather, setIsLoadingWeather] = useState(true)

  useEffect(() => {
    async function loadWeather() {
      setIsLoadingWeather(true)
      try {
        const data = await fetchWeatherData(location)
        setWeatherData(data)
      } catch (error) {
        console.error("[v0] Failed to load weather:", error)
      } finally {
        setIsLoadingWeather(false)
      }
    }

    loadWeather()
  }, [location])

  useEffect(() => {
    const savedUnit = localStorage.getItem("weather-unit") as "C" | "F" | null
    const savedLocation = localStorage.getItem("weather-location")
    const savedLocations = localStorage.getItem("weather-locations")

    if (savedUnit) setUnit(savedUnit)
    if (savedLocation) setLocation(savedLocation)
    if (savedLocations) {
      try {
        setLocations(JSON.parse(savedLocations))
      } catch {}
    }

    const timer = setTimeout(() => setIsLoaded(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const handleUnitChange = (newUnit: "C" | "F") => {
    setUnit(newUnit)
    localStorage.setItem("weather-unit", newUnit)
  }

  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation)
    localStorage.setItem("weather-location", newLocation)
  }

  const handleRemoveLocation = (loc: string) => {
    if (loc === location || locations.length <= 1) return
    const updated = locations.filter((l) => l !== loc)
    setLocations(updated)
    localStorage.setItem("weather-locations", JSON.stringify(updated))
  }

  if (!weatherData || isLoadingWeather) {
    return (
      <main className="min-h-screen bg-weather-bg text-weather-primary font-mono flex items-center justify-center">
        <div className="text-weather-secondary">Loading weather data...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-weather-bg text-weather-primary font-mono flex relative">
      {weatherData && <WeatherParticles condition={weatherData.currentCondition} />}

      <div className="flex-1 flex items-start md:items-center justify-center relative z-10">
        <div
          className={`w-full max-w-md md:max-w-2xl lg:max-w-3xl px-6 md:px-12 lg:px-16 py-10 md:py-16 space-y-10 md:space-y-14 lg:space-y-16 transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <WeatherHeader
            location={location}
            timezone={weatherData.timezone}
            onSettingsClick={() => setSettingsOpen(true)}
          />

          <WeatherSummary data={weatherData} unit={unit} />

          <div className="border-t border-weather-border" />

          <SunTimes sunrise={weatherData.sunrise} sunset={weatherData.sunset} />

          <WeatherGrid periods={weatherData.periods} unit={unit} />
        </div>
      </div>

      <div className="hidden lg:block w-72 flex-shrink-0 relative z-10">
        <div
          className={`h-screen sticky top-0 transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        >
          <SettingsPanel
            isOpen={true}
            onClose={() => {}}
            unit={unit}
            onUnitChange={handleUnitChange}
            location={location}
            onLocationChange={handleLocationChange}
            locations={locations}
            onRemoveLocation={handleRemoveLocation}
            inline={true}
          />
        </div>
      </div>

      <div className="lg:hidden">
        <SettingsPanel
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          unit={unit}
          onUnitChange={handleUnitChange}
          location={location}
          onLocationChange={handleLocationChange}
          locations={locations}
          onRemoveLocation={handleRemoveLocation}
          inline={false}
        />
      </div>
    </main>
  )
}
