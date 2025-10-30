import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-primary/30 text-primary border-primary/50 hover:bg-primary/40 hover:border-primary/70",
    secondary: "bg-secondary text-secondary-foreground border-transparent hover:bg-secondary/80",
    destructive: "bg-destructive/25 text-destructive border-destructive/40 hover:bg-destructive/35",
    outline: "text-foreground border-border/60 hover:border-border hover:bg-accent/50",
    success: "bg-emerald-500/25 text-emerald-600 border-emerald-500/40 dark:bg-emerald-400/25 dark:text-emerald-400 dark:border-emerald-400/40 hover:bg-emerald-500/35",
    warning: "bg-amber-500/25 text-amber-600 border-amber-500/40 dark:bg-amber-400/25 dark:text-amber-400 dark:border-amber-400/40 hover:bg-amber-500/35",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
