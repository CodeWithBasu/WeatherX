"use client"

import { useState, useEffect } from "react"

interface LastUpdatedProps {
  timestamp: Date
}

export function LastUpdated({ timestamp }: LastUpdatedProps) {
  const [relativeTime, setRelativeTime] = useState("")

  useEffect(() => {
    function updateRelativeTime() {
      const now = new Date()
      const diffMs = now.getTime() - timestamp.getTime()
      const diffSeconds = Math.floor(diffMs / 1000)
      const diffMinutes = Math.floor(diffSeconds / 60)
      const diffHours = Math.floor(diffMinutes / 60)

      if (diffSeconds < 60) {
        setRelativeTime("Updated just now")
      } else if (diffMinutes < 60) {
        setRelativeTime(`Updated ${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`)
      } else if (diffHours < 24) {
        setRelativeTime(`Updated ${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`)
      } else {
        setRelativeTime("Updated over a day ago")
      }
    }

    updateRelativeTime()
    const interval = setInterval(updateRelativeTime, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [timestamp])

  return (
    <p className="text-weather-accent text-xs md:text-sm font-mono">
      {relativeTime}
    </p>
  )
}
