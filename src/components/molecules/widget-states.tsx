import { AlertTriangle, Inbox } from "lucide-react"
import type { ReactNode } from "react"

import { Skeleton } from "@/components/ui/skeleton"

export function WidgetError({ message }: { message: string }) {
  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-2 rounded-2xl bg-error-container/60 p-4 text-on-error-container">
      <AlertTriangle className="size-5" aria-hidden="true" />
      <p className="text-xs font-semibold">{message}</p>
    </div>
  )
}

export function WidgetEmpty({
  message,
  action,
}: {
  message: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-1 flex-col items-start justify-center gap-2 rounded-2xl bg-surface-container-low p-4 text-on-surface-variant">
      <Inbox className="size-5" aria-hidden="true" />
      <p className="text-xs font-semibold">{message}</p>
      {action}
    </div>
  )
}

export function WidgetLoading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-28 rounded-xl" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  )
}
