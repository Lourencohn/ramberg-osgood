"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { validateInputs } from "@/lib/validation"
import { predictProperties } from "@/lib/prediction"
import type { PredictionInput } from "@/types"
import { Thermometer, Gauge, Calculator, AlertCircle, Loader2 } from "lucide-react"

export function PredictionForm() {
  const [temperature, setTemperature] = useState("205")
  const [speed, setSpeed] = useState("95")
  const [errors, setErrors] = useState<string[]>([])
  const [isCalculating, setIsCalculating] = useState(false)

  const handleCalculate = async () => {
    const input: PredictionInput = {
      temperature: Number.parseFloat(temperature),
      speed: Number.parseFloat(speed),
    }

    const validation = validateInputs(input)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setErrors([])
    setIsCalculating(true)

    try {
      const results = await predictProperties(input)
      // Trigger results display update via global state or callback
      console.log("Results:", results)
    } catch (error) {
      setErrors(["Erro ao calcular propriedades"])
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Parâmetros de Impressão</CardTitle>
        <CardDescription>Defina temperatura e velocidade para a simulação</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Temperature Input */}
        <div className="space-y-3">
          <Label htmlFor="temperature" className="flex items-center gap-2 text-sm font-medium">
            <Thermometer className="size-4 text-foreground" />
            Temperatura de Impressão
          </Label>
          <div className="relative">
            <Input
              id="temperature"
              type="number"
              min="190"
              max="220"
              step="1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="205"
              className="pr-12 text-lg font-semibold h-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
              °C
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Mínimo: 190°C</span>
            <span>Máximo: 220°C</span>
          </div>
        </div>

        {/* Speed Input */}
        <div className="space-y-3">
          <Label htmlFor="speed" className="flex items-center gap-2 text-sm font-medium">
            <Gauge className="size-4 text-foreground" />
            Velocidade de Impressão
          </Label>
          <div className="relative">
            <Input
              id="speed"
              type="number"
              min="90"
              max="100"
              step="1"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              placeholder="95"
              className="pr-16 text-lg font-semibold h-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
              mm/s
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Mínimo: 90 mm/s</span>
            <span>Máximo: 100 mm/s</span>
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <Alert variant="destructive" className="border-destructive/50">
            <AlertCircle className="size-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleCalculate}
          className="w-full h-12 text-base font-semibold gap-2 shadow-md hover:shadow-lg transition-all"
          disabled={isCalculating}
        >
          {isCalculating ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              <Calculator className="size-5" />
              Calcular Propriedades
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
