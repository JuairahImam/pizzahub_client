"use client"

import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { AuthCard } from "@/components/auth-card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { dashboardPathForRole, signInWithGoogle } from "@/lib/auth/auth-client"
import { getSafeNext } from "@/lib/auth/redirect"
import { useToastContext } from "@/lib/toast/context"
import { cn } from "@/lib/utils"

const inputClassName =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidPassword(value: string) {
  return (
    value.length >= 6 && /[a-z]/.test(value) && /[A-Z]/.test(value)
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const toast = useToastContext()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [accountType, setAccountType] = useState<"customer" | "vendor">(
    "customer"
  )
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("Please enter your full name.")
      return
    }

    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid email address.")
      return
    }

    if (!isValidPassword(password)) {
      setError(
        "Password must be at least 6 characters with one uppercase and one lowercase letter."
      )
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      const user = await register(
        name.trim(),
        email.trim(),
        password,
        accountType
      )
      toast.success("Welcome to PizzaHub!")
      router.push(getSafeNext() ?? dashboardPathForRole(user.role))
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setGoogleLoading(true)

    try {
      await signInWithGoogle(getSafeNext() ?? "/customer")
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Google sign-up failed. Please try again."
      setError(message)
      toast.error(message)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <AuthCard
      title="Create your account"
      description="Join PizzaHub to order pizzas, or register as a restaurant owner to start selling."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:text-primary-hover"
          >
            Sign in
          </Link>
          <span className="mt-2 block">
            Already a vendor?{" "}
            <Link
              href="/vendor"
              className="font-medium text-primary hover:text-primary-hover"
            >
              Vendor dashboard
            </Link>
          </span>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">
            Account role
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {(["customer", "vendor"] as const).map((value) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm transition-colors",
                  accountType === value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:bg-secondary"
                )}
              >
                <input
                  type="radio"
                  name="accountType"
                  value={value}
                  checked={accountType === value}
                  onChange={() => setAccountType(value)}
                  className="sr-only"
                />
                <span className="font-medium text-foreground">
                  {value === "vendor" ? "Vendor" : "Customer"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {value === "vendor"
                    ? "Restaurant owner"
                    : "Order and track pizzas"}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Admin accounts are never created through public registration.
          </p>
        </fieldset>

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your full name"
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={inputClassName}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Min 6 chars, upper + lower case"
              className={cn(inputClassName, "pr-11")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            At least 6 characters, one uppercase and one lowercase letter.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-foreground"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat your password"
            className={inputClassName}
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? "Creating account..." : "Create account"}
        </Button>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs tracking-wide text-muted-foreground uppercase">
            or
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={loading || googleLoading}
          onClick={() => void handleGoogle()}
          className="w-full"
        >
          {googleLoading ? "Connecting..." : "Continue with Google"}
        </Button>
      </form>
    </AuthCard>
  )
}
