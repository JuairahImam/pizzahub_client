import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { SiteChrome } from "@/components/site-chrome"
import { ToastProvider, Toaster } from "@/components/toast"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth/auth-context"
import { CartProvider } from "@/lib/cart/cart-context"
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <SiteChrome>
                  <Toaster />
                  {children}
                </SiteChrome>
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
