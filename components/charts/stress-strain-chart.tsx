"use client"

import { Card } from "@/components/ui/card"

export function StressStrainChart() {
  return (
    <Card className="p-4">
      <div className="h-80 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">Gráfico de Tensão-Deformação será exibido aqui</p>
      </div>
    </Card>
  )
}
