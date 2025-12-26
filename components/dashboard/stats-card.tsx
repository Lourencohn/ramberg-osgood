import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend?: {
    value: number
    label: string
  }
  description?: string
  variant?: "default" | "primary"
}

export function StatsCard({ title, value, icon, trend, description, variant = "default" }: StatsCardProps) {
  return (
    <Card className={`
      transition-all duration-200 hover:shadow-md border
      ${variant === "primary"
        ? "bg-gradient-to-br from-foreground to-foreground/90 text-background border-foreground"
        : "bg-card border-border hover:border-foreground/20"}
    `}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className={`text-sm font-medium ${variant === "primary" ? "text-background/70" : "text-muted-foreground"}`}>{title}</p>
            <p className={`text-2xl font-bold tracking-tight ${variant === "primary" ? "text-background" : "text-foreground"}`}>{value}</p>
          </div>
          <div className={`
            flex size-10 items-center justify-center rounded-lg
            ${variant === "primary" ? "bg-background/20" : "bg-muted"}
          `}>
            {icon}
          </div>
        </div>
        <div className="mt-3">
          {trend && (
            <div className="flex items-center gap-1.5">
              <div className={`
                flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium
                ${variant === "primary"
                  ? "bg-background/20 text-background"
                  : trend.value > 0
                    ? "bg-foreground/10 text-foreground"
                    : "bg-muted text-muted-foreground"}
              `}>
                {trend.value > 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {trend.value > 0 ? "+" : ""}{trend.value}%
              </div>
              <span className={`text-xs ${variant === "primary" ? "text-background/70" : "text-muted-foreground"}`}>{trend.label}</span>
            </div>
          )}
          {description && (
            <p className={`text-xs ${variant === "primary" ? "text-background/70" : "text-muted-foreground"}`}>{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
