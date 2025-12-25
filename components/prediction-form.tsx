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
    <Card>
      <CardHeader>
        <CardTitle>Parâmetros de Impressão</CardTitle>
        <CardDescription>Insira os parâmetros de impressão para prever as propriedades mecânicas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="temperature">Temperatura de Impressão (°C)</Label>
          <Input
            id="temperature"
            type="number"
            min="190"
            max="220"
            step="1"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            placeholder="190 - 220"
          />
          <p className="text-xs text-muted-foreground">Faixa válida: 190°C a 220°C</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="speed">Velocidade de Impressão (mm/s)</Label>
          <Input
            id="speed"
            type="number"
            min="90"
            max="100"
            step="1"
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            placeholder="90 - 100"
          />
          <p className="text-xs text-muted-foreground">Faixa válida: 90 mm/s a 100 mm/s</p>
        </div>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Button onClick={handleCalculate} className="w-full" disabled={isCalculating}>
          {isCalculating ? "Calculando..." : "Calcular Propriedades"}
        </Button>
      </CardContent>
    </Card>
  )
}
