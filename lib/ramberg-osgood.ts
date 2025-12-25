import type { RambergOsgoodParams, StressStrainPoint } from "@/types"

/**
 * Calcula a deformação usando a equação de Ramberg-Osgood
 *
 * Equação: ε = σ/E + 0.002 * (σ/σ₀)^n
 *
 * @param stress - Tensão aplicada σ (MPa)
 * @param params - Parâmetros do modelo (E, σ₀, n)
 * @returns Deformação total ε
 */
export function calculateStrain(stress: number, params: RambergOsgoodParams): number {
  const { E, sigma_0, n } = params

  const elasticStrain = stress / E
  const plasticStrain = 0.002 * Math.pow(stress / sigma_0, n)

  return elasticStrain + plasticStrain
}

/**
 * Calcula a tensão usando a equação de Ramberg-Osgood invertida
 * (Método iterativo de Newton-Raphson)
 *
 * @param strain - Deformação desejada ε
 * @param params - Parâmetros do modelo (E, σ₀, n)
 * @returns Tensão σ (MPa)
 */
export function calculateStress(strain: number, params: RambergOsgoodParams): number {
  const { E, sigma_0, n } = params
  const tolerance = 1e-6
  const maxIterations = 100

  // Estimativa inicial
  let stress = E * strain

  for (let i = 0; i < maxIterations; i++) {
    const f = stress / E + 0.002 * Math.pow(stress / sigma_0, n) - strain
    const df = 1 / E + (0.002 * n * Math.pow(stress / sigma_0, n - 1)) / sigma_0

    const newStress = stress - f / df

    if (Math.abs(newStress - stress) < tolerance) {
      return newStress
    }

    stress = newStress
  }

  return stress
}

/**
 * Gera a curva tensão-deformação completa
 *
 * @param params - Parâmetros do modelo Ramberg-Osgood
 * @param maxStrain - Deformação máxima (padrão: 0.1 = 10%)
 * @param points - Número de pontos na curva (padrão: 100)
 * @returns Array de pontos da curva
 */
export function generateStressStrainCurve(
  params: RambergOsgoodParams,
  maxStrain = 0.1,
  points = 100,
): StressStrainPoint[] {
  const curve: StressStrainPoint[] = []

  for (let i = 0; i <= points; i++) {
    const strain = (i / points) * maxStrain
    const stress = calculateStress(strain, params)

    curve.push({ strain, stress })
  }

  return curve
}
