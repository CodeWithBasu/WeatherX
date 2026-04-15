"use client"

import { useState } from "react"
import { WeatherIcon3D } from "@/components/weather-icon-3d"
import { getComparisonIndicator, getConditionText } from "@/lib/weather-utils"
import type { WeatherPeriod } from "@/lib/mock-weather-data"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface WeatherGridProps {
  periods: WeatherPeriod[]
  unit: "C" | "F"
}

function getComparisonTooltip(indicator: string): string {
  if (indicator === "≈") return "About the same as yesterday"
  if (indicator === "↑") return "Warmer than yesterday"
  if (indicator === "↓") return "Cooler than yesterday"
  return ""
}

export function WeatherGrid({ periods, unit }: WeatherGridProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  const convertTemp = (temp: number) => (unit === "F" ? Math.round((temp * 9) / 5 + 32) : Math.round(temp))

  const handleMobileTap = (periodTime: string) => {
    setActiveTooltip(activeTooltip === periodTime ? null : periodTime)
  }

  return (
    <section className="space-y-4 md:space-y-6">
      <div className="md:hidden font-mono text-sm">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 gap-y-4">
          <div className="text-weather-accent">Time</div>
          <div className="text-weather-accent text-right">Temp</div>
          <div className="text-weather-accent text-center w-6"></div>
          <div className="text-weather-accent text-center w-6"></div>
        </div>

        {/* Data rows with tap-to-show tooltips */}
        {periods.map((period) => {
          const indicator = getComparisonIndicator(period.temp, period.yesterdayTemp)
          const tooltipContent = `${getConditionText(period.condition)}\n${getComparisonTooltip(indicator)}`
          const isActive = activeTooltip === period.time

          return (
            <div key={period.time} className="relative">
              <button
                onClick={() => handleMobileTap(period.time)}
                className="w-full grid grid-cols-[1fr_auto_auto_auto] gap-x-6 py-3 cursor-pointer active:bg-weather-border/20 transition-colors items-center"
              >
                <div className="text-weather-primary text-left">{period.time}</div>
                <div className="text-weather-primary text-right tabular-nums">{convertTemp(period.temp)}°</div>
                <div className="flex justify-center items-center w-8">
                  <WeatherIcon3D condition={period.condition} size={32} isNight={period.time === "Night"} />
                </div>
                <div className="flex justify-center items-center text-weather-secondary text-center w-6">
                  {indicator}
                </div>
              </button>

              {/* Custom tooltip that shows on tap */}
              {isActive && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 
                             bg-weather-primary text-weather-bg px-3 py-2 rounded text-xs 
                             whitespace-pre-line text-center font-mono animate-in fade-in-0 zoom-in-95"
                >
                  {tooltipContent}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 
                                  border-l-[6px] border-l-transparent 
                                  border-r-[6px] border-r-transparent 
                                  border-t-[6px] border-t-weather-primary"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Desktop: horizontal cards with hover tooltips */}
      <TooltipProvider>
        <div className="hidden md:grid md:grid-cols-4 gap-6 lg:gap-10">
          {periods.map((period) => {
            const indicator = getComparisonIndicator(period.temp, period.yesterdayTemp)
            const tooltipContent = `${getConditionText(period.condition)}\n${getComparisonTooltip(indicator)}`

            return (
              <Tooltip key={period.time}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center space-y-3 lg:space-y-4 py-6 lg:py-8 border border-weather-border cursor-pointer overflow-hidden relative">
                    <p className="text-weather-accent text-sm lg:text-base uppercase tracking-wider relative z-10">{period.time}</p>
                    <p className="text-weather-primary text-3xl lg:text-4xl font-mono tabular-nums relative z-10">
                      {convertTemp(period.temp)}°
                    </p>
                    <div className="flex items-center gap-3 relative z-10">
                      <WeatherIcon3D condition={period.condition} size={60} isNight={period.time === "Night"} />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="whitespace-pre-line">{tooltipContent}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    </section>
  )
}
