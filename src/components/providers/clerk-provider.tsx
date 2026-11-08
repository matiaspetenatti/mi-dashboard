"use client"

import { ClerkProvider } from "@clerk/tanstack-react-start"
import { dark } from "@clerk/themes"
import { useTheme } from "next-themes"
import type { ReactNode } from "react"

export function AppClerkProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const appearance: Record<string, unknown> = {
    baseTheme: isDark ? dark : undefined,
    variables: {
      colorPrimary: isDark ? "#9fe870" : "#163300",
      colorBackground: isDark ? "#122206" : "#ffffff",
      borderRadius: "16px",
      fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif",
    },
  }

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      appearance={appearance}
    >
      {children}
    </ClerkProvider>
  )
}
