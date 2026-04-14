import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`)
    
    if (!res.ok) throw new Error("Geocoding failed")

    const data = await res.json()
    
    const results = (data.results || []).map((item: any) => ({
      name: `${item.name}, ${item.admin1 || item.country}`,
      lat: item.latitude,
      lon: item.longitude,
      timezone: item.timezone,
      country: item.country
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Geocoding API Error:", error)
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
  }
}
