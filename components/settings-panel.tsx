"use client"

import { useState, useEffect } from "react"
import { X, Plus, Minus, Search, Loader2 } from "lucide-react"
import { searchLocations } from "@/lib/weather-api"

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  unit: "C" | "F"
  onUnitChange: (unit: "C" | "F") => void
  location: string
  onLocationChange: (location: string) => void
  locations: string[]
  onRemoveLocation: (location: string) => void
  onAddLocation: (location: string) => void
  inline?: boolean
}

export function SettingsPanel({
  isOpen,
  onClose,
  unit,
  onUnitChange,
  location,
  onLocationChange,
  locations,
  onRemoveLocation,
  onAddLocation,
  inline = false,
}: SettingsPanelProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [addQuery, setAddQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (addQuery.trim().length < 2) {
      setSuggestions([])
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchLocations(addQuery)
        setSuggestions(results)
      } catch (err) {
        setSuggestions([])
      } finally {
        setIsSearching(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [addQuery])

  const handleSuggestionClick = (name: string) => {
    onAddLocation(name)
    setAddQuery("")
    setSuggestions([])
    setIsAdding(false)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (addQuery.trim()) {
      onAddLocation(addQuery.trim())
      setAddQuery("")
      setSuggestions([])
      setIsAdding(false)
    }
  }

  const locationButtons = (
    <>
      {locations.map((loc) => (
        <div key={loc} className="flex items-stretch mt-2 first:mt-0">
          <button
            onClick={() => onLocationChange(loc)}
            className={`flex-1 text-left px-4 py-2 font-mono text-sm border border-r-0 transition-colors duration-300 ${
              location === loc
                ? "bg-weather-primary text-weather-bg border-weather-primary"
                : "bg-transparent text-weather-primary border-weather-border hover:border-weather-accent"
            }`}
          >
            {loc}
          </button>
          {location !== loc && locations.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemoveLocation(loc)
              }}
              className="px-3 border border-weather-border bg-transparent text-weather-accent hover:text-red-400 hover:border-red-400 transition-colors duration-300"
              aria-label={`Remove ${loc}`}
            >
              <Minus size={14} strokeWidth={1.5} />
            </button>
          )}
          {(location === loc || locations.length <= 1) && (
            <div
              className={`px-3 flex items-center border transition-colors duration-300 ${
                location === loc
                  ? "border-weather-primary bg-weather-primary"
                  : "border-weather-border bg-transparent"
              }`}
            />
          )}
        </div>
      ))}
      <div className="py-4">
        <hr className="border-weather-border" />
      </div>
      {isAdding ? (
        <form onSubmit={handleAddSubmit} className="flex flex-col gap-2 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search a city..."
              value={addQuery}
              onChange={(e) => setAddQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-2 font-mono text-sm bg-transparent border border-weather-accent text-weather-primary focus:outline-none focus:ring-1 focus:ring-weather-primary"
              autoFocus
            />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-weather-accent">
              {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            </div>
            
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-weather-bg border border-weather-border shadow-lg z-[60] max-h-48 overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <div
                    key={`${s.name}-${idx}`}
                    onClick={() => handleSuggestionClick(s.name)}
                    className="px-4 py-2 text-sm font-mono hover:bg-white/10 cursor-pointer border-b border-weather-border last:border-0"
                  >
                    {s.name} <span className="text-weather-secondary text-xs block">{s.country}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-1 font-mono text-xs border border-weather-primary bg-weather-primary text-weather-bg hover:opacity-90"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="flex-1 py-1 font-mono text-xs border border-weather-border text-weather-secondary hover:text-weather-primary"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-between px-4 py-2 font-mono text-sm border border-weather-border bg-transparent text-weather-accent hover:border-weather-accent hover:text-weather-primary transition-colors duration-300"
        >
          <span>Add Location</span>
          <Plus size={16} strokeWidth={1.5} />
        </button>
      )}
    </>
  )

  const unitButtons = (
    <div className="flex gap-2">
      <button
        onClick={() => onUnitChange("F")}
        className={`px-4 py-2 font-mono text-sm border transition-colors duration-300 ${
          unit === "F"
            ? "bg-weather-primary text-weather-bg border-weather-primary"
            : "bg-transparent text-weather-primary border-weather-border hover:border-weather-accent"
        }`}
      >
        °F
      </button>
      <button
        onClick={() => onUnitChange("C")}
        className={`px-4 py-2 font-mono text-sm border transition-colors duration-300 ${
          unit === "C"
            ? "bg-weather-primary text-weather-bg border-weather-primary"
            : "bg-transparent text-weather-primary border-weather-border hover:border-weather-accent"
        }`}
      >
        °C
      </button>
    </div>
  )

  if (inline) {
    return (
      <div className="bg-weather-bg border-l border-weather-border p-6 h-full">
        <h2 className="hidden text-weather-primary text-lg font-mono mb-8">Settings</h2>

        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-weather-secondary text-sm font-mono block">Temperature</label>
            {unitButtons}
          </div>

          <div className="space-y-3">
            <label className="text-weather-secondary text-sm font-mono block">Location</label>
            <div className="flex flex-col">
              {locationButtons}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-40 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xs bg-weather-bg border-l border-weather-border p-6 transition-transform duration-300 ease-out z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-weather-primary text-lg font-mono">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-weather-accent hover:text-weather-primary transition-colors duration-300"
            aria-label="Close settings"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <label className="text-weather-secondary text-sm font-mono block">Temperature</label>
            {unitButtons}
          </div>

          <div className="space-y-3">
            <label className="text-weather-secondary text-sm font-mono block">Location</label>
            <div className="flex flex-col">
              {locationButtons}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
