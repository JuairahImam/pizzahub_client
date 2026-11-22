"use client"

import { Search, UserX, UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { EmptyState } from "@/components/empty-state"
import { ErrorState } from "@/components/error-state"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { ApiError, apiGet, apiPatch } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { cn } from "@/lib/utils"
import type { AdminUser, AdminUserResponse, AdminUsersResponse } from "@/types/admin-user"

type RoleFilter = "ALL" | "customer" | "vendor" | "admin"
type StatusFilter = "ALL" | "ACTIVE" | "BLOCKED"

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date unavailable"
  return date.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function getRoleClassName(role: AdminUser["role"]) {
  if (role === "admin") {
    return "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200"
  }

  if (role === "vendor") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
  }

  return "bg-secondary text-foreground"
}

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminUsersContent />
    </ProtectedRoute>
  )
}

function AdminUsersContent() {
  const router = useRouter()
  const { loading: authLoading, isAuthenticated, accessToken, user: currentUser } = useAuth()
  const currentUserId = currentUser?.id ?? null

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const limit = 10

  const [users, setUsers] = useState<AdminUser[]>([])
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit,
    totalPages: 1,
  })
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [actionUser, setActionUser] = useState<AdminUser | null>(null)
  const [actionType, setActionType] = useState<"block" | "unblock" | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const requestIdRef = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [roleFilter, statusFilter, debouncedSearch])

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return

    const requestId = ++requestIdRef.current
    setStatus("loading")
    setErrorMessage(null)

    try {
      const response = await apiGet<AdminUsersResponse>(
        ENDPOINTS.adminUsers,
        {
          q: debouncedSearch || undefined,
          role: roleFilter === "ALL" ? undefined : roleFilter,
          blocked:
            statusFilter === "ALL"
              ? undefined
              : statusFilter === "BLOCKED",
          page,
          limit,
        },
        accessToken
      )

      if (requestId !== requestIdRef.current) return

      setUsers(response.users)
      setPagination(response.pagination)
      setStatus("ready")
    } catch (error) {
      if (requestId !== requestIdRef.current) return

      if (error instanceof ApiError) {
        if (error.status === 401) {
          router.replace("/login")
          return
        }

        if (error.status === 403) {
          router.replace("/")
          return
        }

        setErrorMessage(error.message || "Failed to load users.")
      } else {
        setErrorMessage("Failed to load users. Please try again.")
      }

      setStatus("error")
    }
  }, [accessToken, roleFilter, statusFilter, debouncedSearch, page, limit, router])

  useEffect(() => {
    if (authLoading || !isAuthenticated || !accessToken) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUsers()
  }, [authLoading, isAuthenticated, accessToken, fetchUsers])

  async function openDetails(targetUser: AdminUser) {
    if (!accessToken) return

    setSelectedUser(null)
    setDetailsLoading(true)
    setDetailsError(null)

    try {
      const response = await apiGet<AdminUserResponse>(
        ENDPOINTS.adminUser(targetUser.id),
        undefined,
        accessToken
      )

      setSelectedUser(response.user)
    } catch (error) {
      setDetailsError(
        error instanceof ApiError
          ? error.message
          : "Failed to load user details."
      )
    } finally {
      setDetailsLoading(false)
    }
  }

  async function handleBlockUnblock() {
    if (!accessToken || !actionUser || !actionType || actionLoading) return

    setActionLoading(true)
    setActionError(null)

    try {
      const endpoint =
        actionType === "block"
          ? "/api/admin/users/block"
          : "/api/admin/users/unblock"

      await apiPatch(endpoint, { email: actionUser.email }, accessToken)

      setUsers((current) =>
        current.map((user) =>
          user.id === actionUser.id
            ? { ...user, isBlocked: actionType === "block" }
            : user
        )
      )

      setNotice(
        actionType === "block"
          ? "User blocked successfully."
          : "User unblocked successfully."
      )
      setActionUser(null)
      setActionType(null)
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "Failed to update user status."
      )
    } finally {
      setActionLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading users...</p>
      </div>
    )
  }

  if (!isAuthenticated || !accessToken) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
              Admin dashboard
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Manage Users
            </h1>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin")}
            className="h-9 rounded-[8px] px-3"
          >
            Back to overview
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {notice ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-100"
          >
            <p className="flex-1 text-sm leading-relaxed">{notice}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss success message"
              className="-m-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-green-800 transition-colors hover:bg-green-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none dark:text-green-200 dark:hover:bg-green-900/50"
            >
              <span aria-hidden>×</span>
            </button>
          </div>
        ) : null}

        <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["ALL", "customer", "vendor", "admin"] as RoleFilter[]).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={roleFilter === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoleFilter(value)}
                  className="h-9 rounded-[8px] px-3"
                >
                  {value === "ALL" ? "All roles" : value}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {(["ALL", "ACTIVE", "BLOCKED"] as StatusFilter[]).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={statusFilter === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(value)}
                  className="h-9 rounded-[8px] px-3"
                >
                  {value === "ALL"
                    ? "All statuses"
                    : value.charAt(0) + value.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>

            <label className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or email"
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </label>
          </div>
        </section>

        {status === "loading" ? (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading users</span>
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl border border-border bg-card"
              />
            ))}
          </div>
        ) : null}

        {status === "error" ? (
          <ErrorState description={errorMessage ?? undefined} onRetry={fetchUsers} />
        ) : null}

        {status === "ready" && users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Try changing the search or filters."
          />
        ) : null}

        {status === "ready" && users.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3 text-foreground">{user.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", getRoleClassName(user.role))}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            user.isBlocked
                              ? "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200"
                              : "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200"
                          )}
                        >
                          {user.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void openDetails(user)}
                            className="h-9 rounded-[8px] px-3"
                          >
                            Details
                          </Button>
                          <Button
                            type="button"
                            variant={user.isBlocked ? "default" : "destructive"}
                            size="sm"
                            onClick={() => {
                              setActionUser(user)
                              setActionType(user.isBlocked ? "unblock" : "block")
                              setActionError(null)
                            }}
                            disabled={
                              user.role === "admin" ||
                              (!user.isBlocked && user.id === currentUserId)
                            }
                            className="h-9 rounded-[8px] px-3"
                          >
                            {user.isBlocked ? (
                              <>
                                <UserCheck className="size-4" aria-hidden />
                                Unblock
                              </>
                            ) : (
                              <>
                                <UserX className="size-4" aria-hidden />
                                Block
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {Math.max(pagination.totalPages, 1)} ·{" "}
                {pagination.total} total
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={pagination.page <= 1}
                  className="h-9 rounded-[8px] px-3"
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(Math.max(pagination.totalPages, 1), current + 1)
                    )
                  }
                  disabled={pagination.page >= Math.max(pagination.totalPages, 1)}
                  className="h-9 rounded-[8px] px-3"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {selectedUser ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedUser(null)}
          >
            <div
              className="w-full max-w-lg rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <h2
                  id="user-details-title"
                  className="text-lg font-semibold tracking-tight text-foreground"
                >
                  User details
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(null)
                    setDetailsError(null)
                  }}
                  className="h-9 rounded-[8px] px-3"
                >
                  Close
                </Button>
              </div>

              {detailsLoading ? (
                <p className="mt-3 text-sm text-muted-foreground">Loading details...</p>
              ) : null}

              {detailsError ? (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {detailsError}
                </p>
              ) : null}

              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium text-foreground">{selectedUser.name}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium text-foreground">{selectedUser.email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Role</dt>
                  <dd className="font-medium text-foreground">{selectedUser.role}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium text-foreground">
                    {selectedUser.isBlocked ? "Blocked" : "Active"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Joined</dt>
                  <dd className="font-medium text-foreground">
                    {formatDate(selectedUser.createdAt)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}

        {actionUser && actionType ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-action-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => {
              if (!actionLoading) {
                setActionUser(null)
                setActionType(null)
                setActionError(null)
              }
            }}
          >
            <div
              className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6"
              onClick={(event) => event.stopPropagation()}
            >
              <h2
                id="user-action-title"
                className="text-lg font-semibold tracking-tight text-foreground"
              >
                {actionType === "block" ? "Block user" : "Unblock user"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {actionType === "block"
                  ? `Block ${actionUser.name} (${actionUser.email})? They will no longer be able to access protected APIs.`
                  : `Unblock ${actionUser.name} (${actionUser.email})?`}
              </p>

              {actionError ? (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {actionError}
                </p>
              ) : null}

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setActionUser(null)
                    setActionType(null)
                    setActionError(null)
                  }}
                  disabled={actionLoading}
                  className="h-9 rounded-[8px] px-3"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant={actionType === "block" ? "destructive" : "default"}
                  onClick={handleBlockUnblock}
                  disabled={actionLoading}
                  className="h-9 rounded-[8px] px-3"
                >
                  {actionLoading
                    ? "Saving..."
                    : actionType === "block"
                      ? "Block user"
                      : "Unblock user"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
