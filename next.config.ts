import path from "node:path"
import { fileURLToPath } from "node:url"

import type { NextConfig } from "next"

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

// NEXT_PUBLIC_* values are inlined at build time. If a Vercel build has no
// configured value, fall back to the production API so the bundle never
// contains the local development URL. Setting NEXT_PUBLIC_API_URL in Vercel
// remains the preferred way to configure the production API base URL.
if (process.env.VERCEL === "1" && !process.env.NEXT_PUBLIC_API_URL) {
  process.env.NEXT_PUBLIC_API_URL =
    "https://pizzahub-server-toql.onrender.com"
}

const nextConfig: NextConfig = {
  // Keep Turbopack scoped to this repo even when a parent folder has a lockfile.
  turbopack: {
    root: projectRoot,
  },
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "*.ibb.co" },
      // Vendor-supplied menu photography (direct image URLs).
      { protocol: "https", hostname: "allforpizza.com" },
      { protocol: "https", hostname: "thumbs.dreamstime.com" },
      { protocol: "https", hostname: "pinoycupidgifts.com" },
      { protocol: "https", hostname: "pizzapro.in" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "cdn.dotpe.in" },
      { protocol: "https", hostname: "img.magnific.com" },
    ],
  },
}

export default nextConfig
