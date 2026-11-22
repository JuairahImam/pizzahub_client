"use client"

import type { ComponentType } from "react"
import {
  Ban,
  CheckCircle2,
  ChefHat,
  Clock,
  Route,
  XCircle,
} from "lucide-react"

import { OrderStatusBadge } from "@/components/order-status-badge"
import { cn } from "@/lib/utils"
import type { Order, OrderStatus } from "@/types/order"

type TimelineVariant = "full" | "compact"

type TimelineStep = {
  status: OrderStatus
  label: string
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>
}

const normalSteps: TimelineStep[] = [
  { status: "PENDING", label: "Pending order", icon: Clock },
  { status: "CONFIRMED", label: "Vendor confirmed", icon: CheckCircle2 },
  { status: "PREPARING", label: "Preparing", icon: ChefHat },
  { status: "OUT_FOR_DELIVERY", label: "Out for delivery", icon: Route },
  { status: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
]

const rejectedStep: TimelineStep = {
  status: "REJECTED",
  label: "Rejected",
  icon: XCircle,
}

const cancelledStep: TimelineStep = {
  status: "CANCELLED",
  label: "Cancelled",
  icon: Ban,
}

const normalOrderStatusIndex: Record<OrderStatus, number | null> = {
  PENDING: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4,
  REJECTED: null,
  CANCELLED: null,
}

function getTimelineModel(order: Order) {
  const status = order.status

  if (status === "REJECTED") {
    return {
      steps: [normalSteps[0], rejectedStep],
      currentIndex: 1,
      terminal: true,
    }
  }

  if (status === "CANCELLED") {
    return {
      steps: [normalSteps[0], cancelledStep],
      currentIndex: 1,
      terminal: true,
    }
  }

  const currentIndex = normalOrderStatusIndex[status] ?? 0

  return {
    steps: normalSteps.slice(0, currentIndex + 1),
    currentIndex,
    terminal: status === "DELIVERED",
  }
}

function getCompactMessage(order: Order) {
  const index = normalOrderStatusIndex[order.status] ?? 0
  if (order.status === "REJECTED") return "Rejected by vendor"
  if (order.status === "CANCELLED") return "Cancelled by customer"
  return normalSteps[index]?.label ?? "Pending order"
}

export function OrderProgressTimeline({
  order,
  variant = "full",
}: {
  order: Order
  variant?: TimelineVariant
}) {
  const model = getTimelineModel(order)
  const statusLabel =
    order.status === "REJECTED"
      ? "Rejected"
      : order.status === "CANCELLED"
        ? "Cancelled"
        : normalSteps[model.currentIndex]?.label ?? "Pending order"

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3">
        <OrderStatusBadge status={order.status} />
        <span className="text-xs text-muted-foreground">
          {getCompactMessage(order)}
        </span>
      </div>
    )
  }

  return (
    <ol
      className="relative space-y-1"
      aria-label="Order status timeline"
    >
      {model.steps.map((step, index) => {
        const state =
          index < model.currentIndex
            ? "complete"
            : index === model.currentIndex
              ? "current"
              : "upcoming"
        const Icon = step.icon
        const isLast = index === model.steps.length - 1

        return (
          <li
            key={step.status}
            data-status={step.status}
            className={cn("flex items-start gap-3", state === "upcoming" ? "opacity-60" : "")}
          >
            <span className="relative flex items-center justify-center pt-1">
              <span
                className={cn(
                  "grid place-items-center rounded-full",
                  state === "complete" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
                  state === "current" && "bg-primary text-primary-foreground",
                  state === "upcoming" && "bg-secondary text-muted-foreground"
                )}
                style={{ width: 26, height: 26 }}
              >
                <Icon className="size-3.5" aria-hidden={true} />
              </span>
              {!isLast ? (
                <span
                  className={cn(
                    "absolute top-[calc(50%+13px)] h-8 w-0.5 rounded-full",
                    state === "complete" && "bg-green-300 dark:bg-green-700",
                    state === "current" && "bg-primary/30",
                    state === "upcoming" && "bg-border"
                  )}
                />
              ) : null}
            </span>

            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium text-foreground",
                  state === "upcoming" ? "text-muted-foreground" : ""
                )}
              >
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {state === "complete"
                  ? "Completed"
                  : state === "current"
                    ? "In progress"
                    : "Not started"}
              </p>
            </div>
          </li>
        )
      })}
      <span className="sr-only">{statusLabel}</span>
    </ol>
  )
}
