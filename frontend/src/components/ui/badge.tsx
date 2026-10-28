import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "streak"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-primary/20 text-blue-400 border border-blue-500/30",
    secondary: "border-transparent bg-muted text-muted-foreground",
    destructive: "border-transparent bg-danger/20 text-red-400 border border-red-500/30",
    outline: "text-foreground border border-border",
    success: "border-transparent bg-success/20 text-emerald-400 border border-emerald-500/30",
    warning: "border-transparent bg-warning/20 text-amber-400 border border-amber-500/30",
    streak: "border-orange-500/30 bg-orange-500/15 text-orange-400 font-semibold",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
