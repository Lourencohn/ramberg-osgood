import type { PredictionInput, RambergOsgoodParams } from "@/types"

/**
 * Ponto de dado experimental para interpolação
 */
interface ExperimentalPoint {
  temperature: number
  speed: number
  E: number
  sigma_0: number
  n: number
}

/**
 * Dados experimentais base (exemplo - substituir por dados reais)
 */
const EXPERIMENTAL_DATA: ExperimentalPoint[] = [
  { temperature: 190, speed: 90, E: 2800, sigma_0: 45, n: 8.5 },
  { temperature: 190, speed: 100, E: 2750, sigma_0: 43, n: 8.8 },
  { temperature: 205, speed: 90, E: 2900, sigma_0: 48, n: 8.2 },
  { temperature: 205, speed: 100, E: 2850, sigma_0: 46, n: 8.4 },
  { temperature: 220, speed: 90, E: 2700, sigma_0: 42, n: 9.0 },
  { temperature: 220, speed: 100, E: 2650, sigma_0: 40, n: 9.2 },
]

/**
 * Interpola parâmetros usando regressão polinomial de grau 2
 *
 * @param input - Parâmetros de entrada (temperatura e velocidade)
 * @returns Parâmetros de Ramberg-Osgood interpolados
 */
export function polynomialInterpolation(input: PredictionInput): RambergOsgoodParams {
  // Implementação simplificada - usar biblioteca de regressão real
  // Por enquanto, retorna valores estimados

  const { temperature, speed } = input

  // Normalizar entradas
  const tempNorm = (temperature - 205) / 15 // Centro em 205, escala ±15
  const speedNorm = (speed - 95) / 5 // Centro em 95, escala ±5

  // Coeficientes de exemplo (substituir por regressão real)
  const E = 2850 - 50 * tempNorm + 25 * speedNorm
  const sigma_0 = 46 - 2 * tempNorm + 1.5 * speedNorm
  const n = 8.4 + 0.3 * tempNorm - 0.2 * speedNorm

  return { E, sigma_0, n }
}

/**
 * Interpola parâmetros usando funções de base radial (RBF)
 *
 * @param input - Parâmetros de entrada (temperatura e velocidade)
 * @returns Parâmetros de Ramberg-Osgood interpolados
 */
export function rbfInterpolation(input: PredictionInput): RambergOsgoodParams {
  const { temperature, speed } = input

  // Função de base radial gaussiana
  const rbf = (dist: number, epsilon = 0.1): number => {
    return Math.exp(-Math.pow(epsilon * dist, 2))
  }

  let E = 0,
    sigma_0 = 0,
    n = 0
  let weightSum = 0

  for (const point of EXPERIMENTAL_DATA) {
    // Calcular distância euclidiana
    const dist = Math.sqrt(Math.pow(temperature - point.temperature, 2) + Math.pow(speed - point.speed, 2))

    const weight = rbf(dist)
    weightSum += weight

    E += weight * point.E
    sigma_0 += weight * point.sigma_0
    n += weight * point.n
  }

  return {
    E: E / weightSum,
    sigma_0: sigma_0 / weightSum,
    n: n / weightSum,
  }
}
