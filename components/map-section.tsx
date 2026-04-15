"use client"

import { useEffect, useRef, useState } from "react"
import { Loader } from "@googlemaps/js-api-loader"

interface MapSectionProps {
  lat: number
  lon: number
  locationName: string
  onLocationSelect?: (lat: number, lon: number) => void
}

export function MapSection({ lat, lon, locationName, onLocationSelect }: MapSectionProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setIsLoading(false);
      return;
    }

    const loader = new Loader({
      apiKey: apiKey,
      version: "weekly",
    });

    loader.load().then(() => {
      if (!mapRef.current) return;

      const mapOptions: google.maps.MapOptions = {
        center: { lat, lng: lon },
        zoom: 10,
        mapId: 'WEATHER_MAP_ID', // Optional: styling via Google Cloud
        styles: [
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
          },
        ],
        disableDefaultUI: true,
        zoomControl: true,
      };

      const map = new google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;

      const marker = new google.maps.Marker({
        position: { lat, lng: lon },
        map: map,
        title: locationName,
        animation: google.maps.Animation.DROP,
      });
      markerRef.current = marker;

      // Click to select location
      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng && onLocationSelect) {
          const clickedLat = e.latLng.lat();
          const clickedLng = e.latLng.lng();
          onLocationSelect(clickedLat, clickedLng);
        }
      });

      setIsLoading(false);
    }).catch(err => {
      console.error("Maps load error:", err);
      setLoadError("Failed to load interactive map");
      setIsLoading(false);
    });
  }, []);

  // Sync marker and center when props change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const pos = { lat, lng: lon };
      mapInstanceRef.current.setCenter(pos);
      markerRef.current.setPosition(pos);
      markerRef.current.setTitle(locationName);
    }
  }, [lat, lon, locationName]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="w-full h-64 md:h-80 border border-weather-border overflow-hidden relative group">
      {isLoading && (
        <div className="absolute inset-0 bg-weather-bg flex items-center justify-center z-10">
          <div className="animate-pulse text-weather-accent font-mono text-xs">Initializing Satellite Node...</div>
        </div>
      )}
      
      {apiKey ? (
         <div ref={mapRef} className="w-full h-full" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm p-6 text-center space-y-4">
           <div className="text-weather-primary font-mono text-sm uppercase tracking-tighter">Satellite Uplink Offline</div>
           <p className="text-weather-secondary text-[10px] max-w-[200px] leading-relaxed">
             API Key restricted. Add <code className="text-weather-accent">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable interactive targeting.
           </p>
           <div className="w-12 h-px bg-weather-border" />
           <div className="text-weather-accent text-[10px] font-mono tabular-nums opacity-50">
             FIXED POS: {lat.toFixed(4)}, {lon.toFixed(4)}
           </div>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 bg-red-900/20 backdrop-blur-md flex items-center justify-center p-4 text-center z-20">
          <p className="text-xs text-red-200 font-mono">{loadError}</p>
        </div>
      )}

      {/* Modern Overlay */}
      <div className="absolute bottom-4 right-4 bg-weather-bg/60 backdrop-blur-md border border-weather-border px-3 py-1.5 pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-40">
          <p className="text-[9px] text-weather-accent uppercase tracking-widest font-mono mb-0.5">Active Target</p>
          <p className="text-[10px] text-weather-primary font-mono truncate max-w-[120px]">{locationName}</p>
      </div>
      
      <div className="absolute top-4 left-4 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
        <div className="w-4 h-4 border-t border-l border-weather-accent" />
      </div>
      <div className="absolute top-4 right-4 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
        <div className="w-4 h-4 border-t border-r border-weather-accent" />
      </div>
      <div className="absolute bottom-4 left-4 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
        <div className="w-4 h-4 border-b border-l border-weather-accent" />
      </div>
    </div>
  )
}
