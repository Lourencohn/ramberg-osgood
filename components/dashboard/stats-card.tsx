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
}

export function StatsCard({ title, value, icon, trend, description }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              {trend.value > 0 ? (
                <TrendingUp className="size-3 text-chart-1" />
              ) : (
                <TrendingDown className="size-3 text-destructive" />
              )}
              <span>
                {trend.value > 0 ? "+" : ""}
                {trend.value}% {trend.label}
              </span>
            </div>
          )}
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
