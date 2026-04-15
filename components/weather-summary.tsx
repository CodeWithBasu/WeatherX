import { getComparisonText, getSecondaryText, getConditionText } from "@/lib/weather-utils"
import { LastUpdated } from "@/components/last-updated"
import { WeatherIcon3D } from "@/components/weather-icon-3d"
import type { WeatherData } from "@/lib/mock-weather-data"

interface WeatherSummaryProps {
  data: WeatherData
  unit: "C" | "F"
  isNight?: boolean
}

export function WeatherSummary({ data, unit, isNight = false }: WeatherSummaryProps) {
  const displayTemp = unit === "C" ? Math.round(((data.currentTemp - 32) * 5) / 9) : data.currentTemp
  const displayFeelsLike = unit === "C" ? Math.round(((data.feelsLikeTemp - 32) * 5) / 9) : data.feelsLikeTemp
  const comparisonText = getComparisonText(data.todayAvgTemp, data.yesterdayAvgTemp)
  const secondaryText = getSecondaryText(data)
  const conditionText = getConditionText(data.currentCondition)

  return (
    <section className="space-y-6 md:space-y-8">
      <div className="space-y-2 md:space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[72px] md:text-[96px] lg:text-[120px] leading-none text-weather-primary font-mono tracking-tight">
            {displayTemp}°
          </p>
          <div className="hidden md:block">
             <WeatherIcon3D condition={data.currentCondition} size={160} isNight={isNight} />
          </div>
        </div>
        <p className="text-weather-accent text-base md:text-lg lg:text-xl font-mono">Feels like {displayFeelsLike}°</p>
        <div className="flex items-center gap-4">
           <p className="text-weather-secondary text-sm md:text-base">{conditionText}</p>
           <div className="md:hidden">
              <WeatherIcon3D condition={data.currentCondition} size={80} isNight={isNight} />
           </div>
        </div>
        <LastUpdated timestamp={data.lastUpdated} />
      </div>
      <div className="space-y-2 md:space-y-3">
        <p className="text-weather-primary text-xl md:text-2xl lg:text-3xl">{comparisonText}</p>
        <p className="text-weather-secondary text-sm md:text-base lg:text-lg">{secondaryText}</p>
      </div>
    </section>
  )
}
