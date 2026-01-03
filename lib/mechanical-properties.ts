import type { RambergOsgoodParams, MechanicalProperties } from "@/types"
import { calculateStress } from "@/lib/ramberg-osgood"

export function calculateMechanicalProperties(
  params: RambergOsgoodParams,
  maxStrain: number,
): MechanicalProperties {
  const { E, sigma_0, n } = params
  const safeMaxStrain = Number.isFinite(maxStrain) ? Math.max(maxStrain, 0) : 0

  if (!Number.isFinite(E) || !Number.isFinite(sigma_0) || !Number.isFinite(n) || E <= 0 || sigma_0 <= 0) {
    return {
      yieldStress: 0,
      ultimateStress: 0,
      ductility: 0,
      resilience: 0,
      toughness: 0,
    }
  }

  const ultimateStress = calculateStress(safeMaxStrain, params)
  const yieldStress = sigma_0
  const ductility = safeMaxStrain * 100

  const resilience = calculateEnergy(params, sigma_0)
  const toughness = calculateEnergy(params, ultimateStress)

  return {
    yieldStress,
    ultimateStress,
    ductility,
    resilience,
    toughness,
  }
}

function calculateEnergy(params: RambergOsgoodParams, stressLimit: number) {
  const { E, sigma_0, n } = params
  if (!Number.isFinite(stressLimit) || stressLimit <= 0) return 0
  const elasticTerm = (stressLimit * stressLimit) / (2 * E)
  const plasticTerm =
    (0.002 * n * Math.pow(stressLimit, n + 1)) / ((n + 1) * Math.pow(sigma_0, n))
  return elasticTerm + plasticTerm
}
