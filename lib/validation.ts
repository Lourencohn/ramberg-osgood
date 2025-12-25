import type { PredictionInput, ValidationResult } from "@/types"

/**
 * Limites dos parâmetros de entrada
 */
const LIMITS = {
  temperature: { min: 190, max: 220 },
  speed: { min: 90, max: 100 },
}

/**
 * Valida os parâmetros de entrada do usuário
 *
 * @param input - Parâmetros de entrada a serem validados
 * @returns Resultado da validação com flag válido e lista de erros
 */
export function validateInputs(input: PredictionInput): ValidationResult {
  const errors: string[] = []

  // Validar temperatura
  if (isNaN(input.temperature)) {
    errors.push("Temperatura deve ser um número válido")
  } else if (input.temperature < LIMITS.temperature.min || input.temperature > LIMITS.temperature.max) {
    errors.push(`Temperatura deve estar entre ${LIMITS.temperature.min}°C e ${LIMITS.temperature.max}°C`)
  }

  // Validar velocidade
  if (isNaN(input.speed)) {
    errors.push("Velocidade deve ser um número válido")
  } else if (input.speed < LIMITS.speed.min || input.speed > LIMITS.speed.max) {
    errors.push(`Velocidade deve estar entre ${LIMITS.speed.min} mm/s e ${LIMITS.speed.max} mm/s`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
