"use client"

import { useMemo } from "react"

interface WeatherParticlesProps {
  condition: "clear" | "cloudy" | "rain" | "snow" | "partly-cloudy"
}

export function WeatherParticles({ condition }: WeatherParticlesProps) {
  // Generate random positions and delays for particles
  const particles = useMemo(() => {
    const count = {
      rain: 18,
      snow: 22,
      clear: 35,
      "partly-cloudy": 20,
      cloudy: 0, // No individual particles for cloudy
    }[condition]

    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration:
        condition === "rain" ? 1 + Math.random() : condition === "snow" ? 3 + Math.random() * 2 : 2 + Math.random() * 2,
      size: condition === "snow" ? 2 + Math.random() : condition === "clear" ? 1 + Math.random() : 1,
    }))
  }, [condition])

  if (condition === "cloudy") {
    return (
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.06] animate-noise-pan bg-noise" />
      </div>
    )
  }

  if (condition === "partly-cloudy") {
    return (
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Subtle noise for cloudy part */}
        <div className="absolute inset-0 opacity-[0.04] animate-noise-pan bg-noise" />
        {/* Fewer stars */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-weather-accent rounded-full animate-twinkle"
            style={{
              left: `${particle.left}%`,
              top: `${Math.random() * 60}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              opacity: 0.08,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {condition === "rain" &&
        particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-px bg-weather-secondary animate-rain"
            style={{
              left: `${particle.left}%`,
              top: "-50px",
              height: `${20 + Math.random() * 30}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              opacity: 0.1,
            }}
          />
        ))}

      {condition === "snow" &&
        particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-weather-secondary animate-snow"
            style={{
              left: `${particle.left}%`,
              top: "-20px",
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              opacity: 0.08,
            }}
          />
        ))}

      {condition === "clear" &&
        particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-weather-accent animate-twinkle"
            style={{
              left: `${particle.left}%`,
              top: `${Math.random() * 70}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              opacity: 0.07,
            }}
          />
        ))}
    </div>
  )
}
