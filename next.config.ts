import type { NextConfig } from "next"

// NEXT_PUBLIC_* values are inlined at build time. A missing value on Vercel
// silently baked the local fallback into the deployed bundle, so fail the
// production build instead of shipping a frontend that calls localhost.
if (process.env.VERCEL === "1" && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL must be configured in the Vercel project before building."
  )
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
