"use client"

import { cn } from "@/lib/utils"

interface WeatherIcon3DProps {
  condition: "clear" | "cloudy" | "rain" | "snow" | "partly-cloudy"
  className?: string
  size?: number
  isNight?: boolean
}

// ----------------------------------------------------------------------
// CSS-based 3D Sphere "Clay" Construction
// ----------------------------------------------------------------------

export function WeatherIcon3D({ condition, className, size = 120, isNight = false }: WeatherIcon3DProps) {
  const scale = size / 100

  return (
    <div 
      className={cn("relative flex items-center justify-center pointer-events-none select-none", className)}
      style={{ width: size, height: size }}
    >
      <div className="relative w-[100px] h-[100px]" style={{ transform: `scale(${scale})` }}>
        
        {/* ==================== SUN / MOON (Clear) ==================== */}
        {condition === "clear" && (
          <div className="absolute inset-0 flex items-center justify-center animate-spin-slow">
            {isNight ? (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.3),inset_4px_4px_12px_rgba(255,255,255,0.9),0_8px_20px_rgba(255,255,255,0.2)] relative">
                {/* Moon craters */}
                <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-black/10 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.15)]" />
                <div className="absolute bottom-6 right-5 w-3 h-3 rounded-full bg-black/10 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)]" />
                <div className="absolute top-8 right-6 w-5 h-5 rounded-full bg-black/10 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.15)]" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 shadow-[inset_-4px_-4px_8px_rgba(200,100,0,0.4),inset_4px_4px_12px_rgba(255,255,255,0.8),0_8px_20px_rgba(255,160,0,0.4)] relative">
                 {/* Shine */}
                 <div className="absolute top-3 left-3 w-6 h-3 bg-white/40 rounded-full rotate-[-45deg] blur-[1px]" />
              </div>
            )}
          </div>
        )}

        {/* ==================== PARTLY CLOUDY ==================== */}
        {condition === "partly-cloudy" && (
          <div className="relative w-full h-full">
            {/* Sun/Moon Behind */}
            <div className="absolute top-0 right-0 animate-float-delayed">
              {isNight ? (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 shadow-[inset_-2px_-2px_6px_rgba(0,0,0,0.3),inset_2px_2px_8px_rgba(255,255,255,0.9)] relative">
                  <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-black/10 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)]" />
                  <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-black/10 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)]" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 to-orange-500 shadow-[inset_-2px_-2px_6px_rgba(200,100,0,0.4),inset_2px_2px_8px_rgba(255,255,255,0.8)]" />
              )}
            </div>
            {/* Cloud Front */}
            <div className="absolute bottom-2 left-0 animate-float">
               <CloudClay />
            </div>
          </div>
        )}

        {/* ==================== CLOUDY ==================== */}
        {condition === "cloudy" && (
           <div className="relative w-full h-full animate-float">
              {/* Back Cloud (Darker) */}
              <div className="absolute top-2 right-4 opacity-100 scale-90 z-0 grayscale-[0.2] brightness-90">
                 <CloudClay />
              </div>
              {/* Front Cloud */}
              <div className="absolute bottom-2 left-0 z-10">
                 <CloudClay />
              </div>
           </div>
        )}

        {/* ==================== RAIN ==================== */}
        {condition === "rain" && (
           <div className="relative w-full h-full">
              <div className="relative z-20 animate-float">
                <CloudClay />
              </div>
              {/* Raindrops */}
              <div className="absolute bottom-[-10px] left-4 w-full h-10 z-10 flex space-x-2">
                 <div className="w-4 h-6 bg-gradient-to-br from-blue-300 to-blue-600 rounded-full shadow-sm animate-rain" style={{ animationDelay: '0s' }} />
                 <div className="w-4 h-6 bg-gradient-to-br from-blue-300 to-blue-600 rounded-full shadow-sm animate-rain" style={{ animationDelay: '0.5s' }} />
                 <div className="w-4 h-6 bg-gradient-to-br from-blue-300 to-blue-600 rounded-full shadow-sm animate-rain" style={{ animationDelay: '0.2s' }} />
              </div>
           </div>
        )}

        {/* ==================== SNOW ==================== */}
        {condition === "snow" && (
           <div className="relative w-full h-full">
              <div className="relative z-20 animate-float">
                <CloudClay />
              </div>
              {/* Snowflakes */}
              <div className="absolute bottom-[-5px] left-4 w-full h-10 z-10 flex space-x-3">
                 <div className="w-4 h-4 bg-white rounded-full shadow-sm animate-snow" style={{ animationDelay: '0s' }} />
                 <div className="w-5 h-5 bg-white rounded-full shadow-sm animate-snow" style={{ animationDelay: '1.2s' }} />
                 <div className="w-3 h-3 bg-white rounded-full shadow-sm animate-snow" style={{ animationDelay: '0.6s' }} />
              </div>
           </div>
        )}

      </div>
    </div>
  )
}

function CloudClay() {
  // A cloud made of 3 distinct spheres to match the "puffy 3d" reference
  // Layout: 
  //   (Offset Top)
  // (Left) (Right)
  return (
    <div className="relative w-24 h-16">
      {/* Bottom Right Sphere */}
      <div className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-gradient-to-br from-white to-gray-200 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,1),4px_4px_8px_rgba(0,0,0,0.1)] z-10" />
      
      {/* Bottom Left Sphere */}
      <div className="absolute bottom-0 left-0 w-12 h-12 rounded-full bg-gradient-to-br from-white to-gray-200 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,1),-2px_4px_8px_rgba(0,0,0,0.1)] z-10" />

      {/* Center Top Sphere (Main) - Increased size for puffiness */}
      <div className="absolute bottom-3 left-4 w-16 h-16 rounded-full bg-gradient-to-br from-white to-gray-100 shadow-[inset_-3px_-3px_6px_rgba(0,0,0,0.1),inset_3px_3px_6px_rgba(255,255,255,1),0_8px_15px_rgba(0,0,0,0.15)] z-20" role="img" aria-label="Cloud puff" />
      
      {/* Bridge to hide gaps */}
      <div className="absolute bottom-2 left-5 w-14 h-8 bg-gray-100 z-15" />
    </div>
  )
}
