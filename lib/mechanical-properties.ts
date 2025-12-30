import type { RambergOsgoodParams, MechanicalProperties, StressStrainPoint } from "@/types"


export function calculateMechanicalProperties(
  params: RambergOsgoodParams,
  curve: StressStrainPoint[],
): MechanicalProperties {
  const { E, sigma_0 } = params


  const yieldStress = calculateYieldStress(curve, 0.002)


  const ultimateStress = curve[curve.length - 1].stress


  const ductility = curve[curve.length - 1].strain * 100


  const resilience = calculateAreaUnderCurve(curve.filter((p) => p.stress <= yieldStress))


  const toughness = calculateAreaUnderCurve(curve)

  return {
    yieldStress,
    ultimateStress,
    ductility,
    resilience,
    toughness,
  }
}


function calculateYieldStress(curve: StressStrainPoint[], offset = 0.002): number {

  for (let i = 1; i < curve.length; i++) {
    const linearStrain = curve[i].strain - offset
    if (linearStrain > 0) {
      return curve[i].stress
    }
  }

  return curve[curve.length - 1].stress
}


function calculateAreaUnderCurve(curve: StressStrainPoint[]): number {
  let area = 0

  for (let i = 1; i < curve.length; i++) {
    const deltaStrain = curve[i].strain - curve[i - 1].strain
    const avgStress = (curve[i].stress + curve[i - 1].stress) / 2
    area += avgStress * deltaStrain
  }

  return area
}
