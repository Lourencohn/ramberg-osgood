import type { RambergOsgoodParams, StressStrainPoint } from "@/types"


export function calculateStrain(stress: number, params: RambergOsgoodParams): number {
  const { E, sigma_0, n } = params

  const elasticStrain = stress / E
  const plasticStrain = 0.002 * Math.pow(stress / sigma_0, n)

  return elasticStrain + plasticStrain
}


export function calculateStress(strain: number, params: RambergOsgoodParams): number {
  const { E, sigma_0, n } = params
  const tolerance = 1e-6
  const maxIterations = 100


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
