import type { NextConfig } from "next"

// NEXT_PUBLIC_* values are inlined at build time. If a Vercel build has no
// configured value, fall back to the production API so the bundle never
// contains the local development URL. Setting NEXT_PUBLIC_API_URL in Vercel
// remains the preferred way to configure the production API base URL.
if (process.env.VERCEL === "1" && !process.env.NEXT_PUBLIC_API_URL) {
  process.env.NEXT_PUBLIC_API_URL =
    "https://pizzahub-server-toql.onrender.com"
}

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "*.ibb.co" },
    ],
  },
}

export default nextConfig
