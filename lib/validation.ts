import type { PredictionInput, ValidationResult } from '@/types'

export type PredictionLimits = {
  temperature: { min: number; max: number }
  speed: { min: number; max: number }
}

export const DEFAULT_LIMITS: PredictionLimits = {
  temperature: { min: 190, max: 220 },
  speed: { min: 90, max: 100 },
}

function resolveRange(range: { min: number; max: number }, fallback: { min: number; max: number }) {
  const min = Number.isFinite(range.min) ? range.min : fallback.min
  const max = Number.isFinite(range.max) ? range.max : fallback.max
  return min <= max ? { min, max } : { min: max, max: min }
}

export function validateInputs(
  input: PredictionInput,
  limits: PredictionLimits = DEFAULT_LIMITS
): ValidationResult {
  const errors: string[] = []
  const temperatureRange = resolveRange(limits.temperature, DEFAULT_LIMITS.temperature)
  const speedRange = resolveRange(limits.speed, DEFAULT_LIMITS.speed)

  if (isNaN(input.temperature)) {
    errors.push('Temperatura deve ser um número válido')
  } else if (input.temperature < temperatureRange.min || input.temperature > temperatureRange.max) {
    errors.push(
      `Temperatura fora da faixa experimental (${temperatureRange.min}°C–${temperatureRange.max}°C)`
    )
  }

  if (isNaN(input.speed)) {
    errors.push('Velocidade deve ser um número válido')
  } else if (input.speed < speedRange.min || input.speed > speedRange.max) {
    errors.push(`Velocidade fora da faixa experimental (${speedRange.min}–${speedRange.max} mm/s)`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
