import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextType {
  activeTab: string
  setActiveTab: (val: string) => void
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined)

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (val: string) => void
  children: React.ReactNode
  className?: string
}) {
  const [tab, setTab] = React.useState(defaultValue || "")
  const currentTab = value !== undefined ? value : tab

  const handleTabChange = (val: string) => {
    if (onValueChange) {
      onValueChange(val)
    } else {
      setTab(val)
    }
  }

  return (
    <TabsContext.Provider value={{ activeTab: currentTab, setActiveTab: handleTabChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg bg-muted/60 p-1 text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsTrigger must be used inside Tabs")
  const isActive = context.activeTab === value

  return (
    <button
      type="button"
      onClick={() => context.setActiveTab(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-card text-white shadow-sm font-semibold"
          : "hover:text-foreground text-muted-foreground",
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const context = React.useContext(TabsContext)
  if (!context) throw new Error("TabsContent must be used inside Tabs")

  if (context.activeTab !== value) return null
  return <div className={cn("mt-3 focus-visible:outline-none", className)}>{children}</div>
}
