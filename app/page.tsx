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
import { Meteors } from "@/components/ui/meteors"
import { Particles } from "@/components/ui/particles"
import { MapSection } from "@/components/map-section"

export default function WeatherPage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const refreshWeather = () => setRefreshTrigger((prev) => prev + 1)
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
  const [isNight, setIsNight] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (weatherData) {
      const currentHour = parseInt(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: false,
          timeZone: weatherData.timezone,
        })
      )
      setIsNight(currentHour >= 18 || currentHour < 4)
    }
  }, [weatherData])

  useEffect(() => {
    async function loadWeather() {
      setIsLoadingWeather(true)
      setError(null)
      try {
        const data = await fetchWeatherData(location)
        setWeatherData(data)
      } catch (err: any) {
        console.error("Failed to load weather:", err)
        setError(err.message || "Failed to load weather data.")
      } finally {
        setIsLoadingWeather(false)
      }
    }

    loadWeather()
  }, [location, refreshTrigger])

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

  const handleAddLocation = (loc: string) => {
    if (locations.includes(loc)) return
    const updated = [...locations, loc]
    setLocations(updated)
    localStorage.setItem("weather-locations", JSON.stringify(updated))
    handleLocationChange(loc)
  }

  const handleMapSelect = async (lat: number, lon: number) => {
    setIsLoadingWeather(true)
    try {
      const data = await fetchWeatherData(`${lat.toFixed(2)},${lon.toFixed(2)}`, { 
        lat, 
        lon, 
        timezone: "auto" 
      })
      setWeatherData(data)
      setLocation(data.location)
      setIsLoaded(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoadingWeather(false)
    }
  }

  if (error) {
    return (
      <main className="min-h-screen bg-weather-bg text-weather-primary font-mono flex items-center justify-center flex-col gap-4 p-4">
        <div className="text-red-400 text-center max-w-md">{error}</div>
        <button 
          onClick={refreshWeather}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-sm"
        >
          Retry
        </button>
      </main>
    )
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

          <WeatherSummary data={weatherData} unit={unit} isNight={isNight} />

          <div className="border-t border-weather-border" />

          <SunTimes sunrise={weatherData.sunrise} sunset={weatherData.sunset} />

          <WeatherGrid periods={weatherData.periods} unit={unit} />
          
          <div className="lg:hidden mt-4">
             <MapSection 
                lat={weatherData.lat} 
                lon={weatherData.lon} 
                locationName={location} 
                onLocationSelect={handleMapSelect}
             />
          </div>
        </div>
      </div>

      <div className="hidden lg:block w-72 shrink-0 relative z-10">
        <div
          className={`h-screen sticky top-0 overflow-y-auto transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
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
            onAddLocation={handleAddLocation}
            inline={true}
          />
          <div className="mt-8 px-4">
             <div className="h-px bg-weather-border mb-8" />
             <MapSection 
                lat={weatherData.lat} 
                lon={weatherData.lon} 
                locationName={location} 
                onLocationSelect={handleMapSelect}
             />
          </div>
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
          onAddLocation={handleAddLocation}
          inline={false}
        />
      </div>

      {/* Background Weather Effects */}
      {(() => {
        const condition = weatherData?.currentCondition

        // Night time effects
        if (isNight) {
          return (
             <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <Meteors number={20} />
                <Particles
                  className="absolute inset-0"
                  quantity={50}
                  ease={80}
                  color="#ffffff"
                  refresh
                />
             </div>
          )
        }

        // Day time effects
        if (!isNight) {
          return (
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              {/* Day Sky Base Tint - ALWAYS Visible in Day Mode */}
              <div className="absolute inset-0 bg-linear-to-br from-blue-900/20 via-black to-black opacity-100" />

              {/* Debug Info (Remove later) */}
              <div className="absolute top-2 left-2 text-[10px] text-white/30 font-mono z-50">
                 Mode: Day | Cond: {condition}
              </div>

              {/* Sun Rays (Clear / Partly Cloudy) - SIMPLIFIED GRADIENT */}
              {(condition === "clear" || condition === "partly-cloudy") && (
                 <div className="absolute -top-[20%] -right-[20%] w-[100%] h-[100%] bg-blue-500/10 blur-[100px] rounded-full animate-pulse" />
              )}
               {(condition === "clear" || condition === "partly-cloudy") && (
                  <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[80%] bg-linear-to-br from-orange-400/30 via-yellow-500/10 to-transparent blur-3xl opacity-100 animate-spin-slow" style={{ animationDuration: '40s' }} />
              )}
              
              {/* Rain (Rainy) */}
              {condition === "rain" && (
                <div className="absolute inset-0 bg-linear-to-b from-blue-900/30 to-transparent">
                   {[...Array(50)].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute w-[2px] h-16 bg-blue-400/50 rounded-full animate-rain"
                        style={{
                           left: `${Math.random() * 100}%`,
                           top: `-${Math.random() * 20}%`,
                           animationDelay: `${Math.random() * 2}s`,
                           animationDuration: `${0.5 + Math.random() * 0.5}s`
                        }}
                      />
                   ))}
                </div>
              )}

              {/* Clouds (Cloudy / Rain / Snow / Partly Cloudy) */}
              {(condition === "cloudy" || condition === "rain" || condition === "snow" || condition === "partly-cloudy") && (
                 <div className="absolute inset-0">
                    <div className="absolute top-10 left-10 w-60 h-60 bg-white/10 rounded-full blur-[80px]" />
                    <div className="absolute bottom-20 right-20 w-80 h-80 bg-gray-400/10 rounded-full blur-[100px]" />
                 </div>
              )}
            </div>
          )
        }

        return null
      })()}

      {/* Dev Toggle */}
      <button
        onClick={() => setIsNight(!isNight)}
        className="fixed bottom-4 right-4 z-50 bg-black/20 backdrop-blur-md border border-white/10 text-white/50 hover:text-white px-3 py-1 rounded-full text-[10px] font-mono hover:bg-black/40 transition-all uppercase tracking-wider"
      >
        {isNight ? "Switch to Day" : "Switch to Night"}
      </button>
    </main>
  )
}
