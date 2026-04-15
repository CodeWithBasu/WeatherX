"use client"

import { useEffect, useRef } from "react"

interface MapSectionProps {
  lat: number
  lon: number
  locationName: string
}

export function MapSection({ lat, lon, locationName }: MapSectionProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // If we have an API key, we can use the full JS API
    // For now, let's use a beautiful iframe embed as a robust starting point 
    // that works immediately for the user
    if (mapRef.current) {
      // We can also use Google Maps Embed API (requires key but has a generous free tier)
      // Or for a quick "WOW" we can use a stylized map
    }
  }, [lat, lon])

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  // If no API key, we can show a placeholder or a generic embed
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey || ""}&q=${lat},${lon}&zoom=10&maptype=roadmap`;

  return (
    <div className="w-full h-64 md:h-80 border border-weather-border overflow-hidden relative group">
      <div className="absolute inset-0 bg-weather-bg flex items-center justify-center -z-10">
        <div className="animate-pulse text-weather-accent font-mono text-sm">Loading Map...</div>
      </div>
      
      {apiKey ? (
         <iframe
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'grayscale(1) invert(0.9) contrast(1.2)' }}
            loading="lazy"
            allowFullScreen
            src={embedUrl}
          ></iframe>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm p-6 text-center space-y-4">
           <div className="text-weather-primary font-mono text-sm">Google Maps Integration Ready</div>
           <p className="text-weather-secondary text-xs max-w-xs">
             Please add <code className="text-weather-accent">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your .env file to activate the live interactive satellite view.
           </p>
           {/* Fallback to a static-ish look or just a styled placeholder */}
           <div className="w-full h-px bg-weather-border" />
           <div className="text-weather-accent text-xs tabular-nums">
             Coordinates: {lat.toFixed(4)}, {lon.toFixed(4)}
           </div>
        </div>
      )}

      {/* Modern Overlay */}
      <div className="absolute top-4 left-4 bg-weather-bg/80 backdrop-blur-md border border-weather-border px-3 py-1.5">
          <p className="text-[10px] text-weather-accent uppercase tracking-widest font-mono">Location Context</p>
          <p className="text-xs text-weather-primary font-mono">{locationName}</p>
      </div>
    </div>
  )
}
