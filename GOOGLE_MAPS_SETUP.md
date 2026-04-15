# 🌍 Google Maps Integration Guide for WeatherX

This project features a premium, stylized Google Maps integration. While the UI component is already built and styled to match the dark aesthetic, you need to provide a Google Maps API Key to unlock interactive features like satellite view, terrain mode, and markers.

## Step 1: Obtain a Google Maps API Key

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (e.g., "WeatherX").
3.  Navigate to **APIs & Services > Library**.
4.  Search for and enable the **Maps JavaScript API**.
5.  Search for and enable the **Maps Embed API** (used for the dashboard card).
6.  Go to **APIs & Services > Credentials**.
7.  Click **Create Credentials > API Key**.
8.  *Recommended:* Restrict your API key to your website's domain in the "API restrictions" section to prevent unauthorized usage.

## Step 2: Configure Environment Variables

1.  Open the `.env` file in the root directory of this project.
2.  Add your API key using the following variable name:
    ```env
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_API_KEY_HERE"
    ```
3.  Restart your development server (`npm run dev`) for the changes to take effect.

## Step 3: Customizing the Map Look

The map is currently styled via CSS filters in `components/map-section.tsx` to maintain the "Cyber-Dark" aesthetic:

```tsx
// Example of the filter applied in map-section.tsx
filter: 'grayscale(1) invert(0.9) contrast(1.2)'
```

If you prefer the original Google Maps colors, simply remove the `style={{ filter: ... }}` attribute from the `iframe` or `GoogleMap` component.

## Troubleshooting

-   **"Oops! Something went wrong"**: This usually means the API key is invalid or the Maps JavaScript API hasn't been enabled yet in the Google Cloud Console.
-   **Gray Screen**: Ensure your internet connection is stable and that you don't have an ad-blocker preventing the Google Maps script from loading.
-   **Billing**: Note that Google Maps has a generous free tier ($200/month credit), but you must link a billing account to the Cloud project for the key to work.

---
*Created with ❤️ by Antigravity*
