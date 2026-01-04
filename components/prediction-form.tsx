'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DEFAULT_LIMITS, type PredictionLimits } from '@/lib/validation'
import { predictProperties } from '@/lib/prediction'
import { useSettings } from '@/components/settings-provider'
import {
  convertSpeed,
  convertTemperature,
  getUnitLabels,
  toBaseSpeed,
  toBaseTemperature,
} from '@/lib/units'
import type { PredictionInput, PredictionResult, RambergOsgoodTrainingPoint } from '@/types'
import { Thermometer, Gauge, Calculator, AlertCircle, Loader2 } from 'lucide-react'

type PredictionFormProps = {
  trainingData: RambergOsgoodTrainingPoint[]
  onResult: (result: PredictionResult) => void
}

const tempFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

const speedFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})

export function PredictionForm({ trainingData, onResult }: PredictionFormProps) {
  const { settings } = useSettings()
  const unitLabels = getUnitLabels(settings.unitSystem)
  const [temperature, setTemperature] = useState('205')
  const [speed, setSpeed] = useState('95')
  const [errors, setErrors] = useState<string[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const limits = useMemo<PredictionLimits>(() => {
    if (!trainingData.length) return DEFAULT_LIMITS
    const temps = trainingData
      .map((point) => point.temperature)
      .filter((value) => Number.isFinite(value) && value > 0)
    const speeds = trainingData
      .map((point) => point.speed)
      .filter((value) => Number.isFinite(value) && value > 0)
    if (!temps.length || !speeds.length) return DEFAULT_LIMITS
    return {
      temperature: { min: Math.min(...temps), max: Math.max(...temps) },
      speed: { min: Math.min(...speeds), max: Math.max(...speeds) },
    }
  }, [trainingData])

  const displayLimits = useMemo(
    () => ({
      temperature: {
        min:
          convertTemperature(limits.temperature.min, settings.unitSystem) ?? limits.temperature.min,
        max:
          convertTemperature(limits.temperature.max, settings.unitSystem) ?? limits.temperature.max,
      },
      speed: {
        min: convertSpeed(limits.speed.min, settings.unitSystem) ?? limits.speed.min,
        max: convertSpeed(limits.speed.max, settings.unitSystem) ?? limits.speed.max,
      },
    }),
    [limits, settings.unitSystem]
  )

  const previousUnitSystem = useRef(settings.unitSystem)

  useEffect(() => {
    const previous = previousUnitSystem.current
    if (previous === settings.unitSystem) return

    const tempValue = Number.parseFloat(temperature)
    const speedValue = Number.parseFloat(speed)

    if (Number.isFinite(tempValue)) {
      const nextTemp =
        previous === 'si'
          ? convertTemperature(tempValue, settings.unitSystem)
          : toBaseTemperature(tempValue, previous)
      if (nextTemp !== null) {
        setTemperature(String(Math.round(nextTemp * 10) / 10))
      }
    }

    if (Number.isFinite(speedValue)) {
      const nextSpeed =
        previous === 'si'
          ? convertSpeed(speedValue, settings.unitSystem)
          : toBaseSpeed(speedValue, previous)
      if (nextSpeed !== null) {
        setSpeed(String(Math.round(nextSpeed * 10) / 10))
      }
    }

    previousUnitSystem.current = settings.unitSystem
  }, [settings.unitSystem, speed, temperature])

  const resolveMethod = () => {
    if (settings.interpolationMethod !== 'auto') return settings.interpolationMethod
    return trainingData.length > 12 ? 'rbf' : 'polynomial'
  }

  const formatRange = (min: number, max: number, unit: string, formatter: Intl.NumberFormat) =>
    `${formatter.format(min)} ${unit}–${formatter.format(max)} ${unit}`

  const validateInput = (input: PredictionInput, raw: PredictionInput) => {
    const baseErrors: string[] = []

    if (isNaN(raw.temperature)) {
      baseErrors.push('Temperatura deve ser um número válido')
    } else if (input.temperature <= 0) {
      baseErrors.push('Temperatura deve ser maior que zero')
    } else if (settings.autoValidation) {
      const min = limits.temperature.min
      const max = limits.temperature.max
      if (input.temperature < min || input.temperature > max) {
        baseErrors.push(
          `Temperatura fora da faixa experimental (${formatRange(
            displayLimits.temperature.min,
            displayLimits.temperature.max,
            unitLabels.temperature,
            tempFormatter
          )})`
        )
      }
    }

    if (isNaN(raw.speed)) {
      baseErrors.push('Velocidade deve ser um número válido')
    } else if (input.speed <= 0) {
      baseErrors.push('Velocidade deve ser maior que zero')
    } else if (settings.autoValidation) {
      const min = limits.speed.min
      const max = limits.speed.max
      if (input.speed < min || input.speed > max) {
        baseErrors.push(
          `Velocidade fora da faixa experimental (${formatRange(
            displayLimits.speed.min,
            displayLimits.speed.max,
            unitLabels.speed,
            speedFormatter
          )})`
        )
      }
    }

    return {
      valid: baseErrors.length === 0,
      errors: baseErrors,
    }
  }

  const handleCalculate = async () => {
    const rawInput: PredictionInput = {
      temperature: Number.parseFloat(temperature),
      speed: Number.parseFloat(speed),
    }
    const input: PredictionInput = {
      temperature: toBaseTemperature(rawInput.temperature, settings.unitSystem) ?? NaN,
      speed: toBaseSpeed(rawInput.speed, settings.unitSystem) ?? NaN,
    }

    const validation = validateInput(input, rawInput)
    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    if (!trainingData.length) {
      setErrors(['Não há dados reais suficientes para gerar a previsão.'])
      return
    }

    setErrors([])
    setIsCalculating(true)

    try {
      const results = await predictProperties(input, trainingData, {
        method: resolveMethod(),
        curvePoints: settings.stressCurvePoints,
      })
      onResult(results)
    } catch (error) {
      setErrors(['Erro ao calcular propriedades'])
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Parâmetros de Impressão</CardTitle>
        <CardDescription>
          Informe as condições para estimar as propriedades mecânicas.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="temperature" className="flex items-center gap-2 text-sm font-medium">
              <Thermometer className="size-4 text-foreground" />
              Temperatura de Impressão
            </Label>
            <div className="relative">
              <Input
                id="temperature"
                type="number"
                min={displayLimits.temperature.min}
                max={displayLimits.temperature.max}
                step="1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder={tempFormatter.format(
                  (displayLimits.temperature.min + displayLimits.temperature.max) / 2
                )}
                className="pr-12 text-lg font-semibold h-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                {unitLabels.temperature}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Mínimo: {tempFormatter.format(displayLimits.temperature.min)}{' '}
                {unitLabels.temperature}
              </span>
              <span>
                Máximo: {tempFormatter.format(displayLimits.temperature.max)}{' '}
                {unitLabels.temperature}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="speed" className="flex items-center gap-2 text-sm font-medium">
              <Gauge className="size-4 text-foreground" />
              Velocidade de Impressão
            </Label>
            <div className="relative">
              <Input
                id="speed"
                type="number"
                min={displayLimits.speed.min}
                max={displayLimits.speed.max}
                step="1"
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                placeholder={speedFormatter.format(
                  (displayLimits.speed.min + displayLimits.speed.max) / 2
                )}
                className="pr-16 text-lg font-semibold h-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                {unitLabels.speed}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Mínimo: {speedFormatter.format(displayLimits.speed.min)} {unitLabels.speed}
              </span>
              <span>
                Máximo: {speedFormatter.format(displayLimits.speed.max)} {unitLabels.speed}
              </span>
            </div>
          </div>

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
        </div>

        <div className="space-y-4 pt-6">
          <p className="text-xs text-muted-foreground">
            {trainingData.length > 0
              ? `Baseado em ${trainingData.length} perfis reais com ajuste Ramberg-Osgood.`
              : 'Nenhum perfil com dados suficientes para ajuste foi encontrado.'}
          </p>
          {!settings.autoValidation ? (
            <p className="text-xs text-amber-600">
              Validação automática desativada. Resultados podem extrapolar a faixa experimental.
            </p>
          ) : null}

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
        </div>
      </CardContent>
    </Card>
  )
}
