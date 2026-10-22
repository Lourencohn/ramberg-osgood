import type { RambergOsgoodParams, MechanicalProperties, StressStrainPoint } from '@/types'
import { calculateStress } from '@/lib/ramberg-osgood'

export function calculateMechanicalProperties(
  params: RambergOsgoodParams,
  maxStrain: number
): MechanicalProperties {
  const { E, sigma_0, n } = params
  const safeMaxStrain = Number.isFinite(maxStrain) ? Math.max(maxStrain, 0) : 0

  if (
    !Number.isFinite(E) ||
    !Number.isFinite(sigma_0) ||
    !Number.isFinite(n) ||
    E <= 0 ||
    sigma_0 <= 0
  ) {
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
  const plasticTerm = (0.002 * n * Math.pow(stressLimit, n + 1)) / ((n + 1) * Math.pow(sigma_0, n))
  return elasticTerm + plasticTerm
}

export function calculatePropertiesFromCurve(curve: StressStrainPoint[]): MechanicalProperties & {
  modulus: number
} {
  const points = curve.filter(
    (point) => Number.isFinite(point.strain) && Number.isFinite(point.stress)
  )
  if (points.length < 3) {
    return {
      yieldStress: 0,
      ultimateStress: 0,
      ductility: 0,
      resilience: 0,
      toughness: 0,
      modulus: 0,
    }
  }
  const initial = points.slice(1, Math.max(3, Math.ceil(points.length * 0.1)))
  const modulus =
    initial.reduce((sum, point) => sum + point.stress * point.strain, 0) /
    initial.reduce((sum, point) => sum + point.strain * point.strain, 0)
  let ultimateStress = 0
  for (const point of points) ultimateStress = Math.max(ultimateStress, point.stress)
  const ductility = points[points.length - 1].strain * 100

  let yieldStress = ultimateStress
  const gap = (point: StressStrainPoint) => point.stress - modulus * (point.strain - 0.002)
  for (let i = 1; i < points.length; i += 1) {
    if (gap(points[i]) <= 0 && gap(points[i - 1]) > 0) {
      const t = gap(points[i - 1]) / (gap(points[i - 1]) - gap(points[i]))
      yieldStress = points[i - 1].stress + t * (points[i].stress - points[i - 1].stress)
      break
    }
  }
  let toughness = 0
  for (let i = 1; i < points.length; i += 1) {
    toughness +=
      ((points[i].stress + points[i - 1].stress) / 2) * (points[i].strain - points[i - 1].strain)
  }
  return {
    yieldStress,
    ultimateStress,
    ductility,
    resilience: (yieldStress * yieldStress) / (2 * modulus),
    toughness,
    modulus,
  }
}
