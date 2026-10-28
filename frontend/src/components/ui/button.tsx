import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "accent"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"
    
    const variants = {
      default: "bg-primary text-white hover:bg-blue-600 shadow-sm shadow-blue-500/20",
      accent: "bg-accent text-white hover:bg-orange-600 shadow-sm shadow-orange-500/20",
      destructive: "bg-danger text-white hover:bg-red-600",
      outline: "border border-border bg-transparent hover:bg-muted/60 text-foreground",
      secondary: "bg-muted text-foreground hover:bg-muted/80",
      ghost: "hover:bg-muted/60 text-foreground hover:text-white",
      link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
    }

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-12 rounded-lg px-8 text-base font-semibold",
      icon: "h-10 w-10",
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
