import type { RambergOsgoodParams, MechanicalProperties, StressStrainPoint } from "@/types"

/**
 * Calcula propriedades mecânicas derivadas dos parâmetros de Ramberg-Osgood
 * e da curva tensão-deformação
 *
 * @param params - Parâmetros do modelo Ramberg-Osgood
 * @param curve - Curva tensão-deformação
 * @returns Propriedades mecânicas calculadas
 */
export function calculateMechanicalProperties(
  params: RambergOsgoodParams,
  curve: StressStrainPoint[],
): MechanicalProperties {
  const { E, sigma_0 } = params

  // Tensão de escoamento (0.2% offset)
  const yieldStress = calculateYieldStress(curve, 0.002)

  // Tensão máxima (último ponto da curva)
  const ultimateStress = curve[curve.length - 1].stress

  // Ductilidade (deformação na ruptura, em %)
  const ductility = curve[curve.length - 1].strain * 100

  // Resiliência (área sob a curva até escoamento)
  const resilience = calculateAreaUnderCurve(curve.filter((p) => p.stress <= yieldStress))

  // Tenacidade (área total sob a curva)
  const toughness = calculateAreaUnderCurve(curve)

  return {
    yieldStress,
    ultimateStress,
    ductility,
    resilience,
    toughness,
  }
}

/**
 * Calcula a tensão de escoamento usando o método de offset
 *
 * @param curve - Curva tensão-deformação
 * @param offset - Offset de deformação (padrão: 0.002 = 0.2%)
 * @returns Tensão de escoamento (MPa)
 */
function calculateYieldStress(curve: StressStrainPoint[], offset = 0.002): number {
  // Encontrar o ponto onde a curva se afasta da linha de offset
  for (let i = 1; i < curve.length; i++) {
    const linearStrain = curve[i].strain - offset
    if (linearStrain > 0) {
      return curve[i].stress
    }
  }

  return curve[curve.length - 1].stress
}

/**
 * Calcula a área sob a curva usando regra do trapézio
 *
 * @param curve - Curva tensão-deformação
 * @returns Área sob a curva (MJ/m³)
 */
function calculateAreaUnderCurve(curve: StressStrainPoint[]): number {
  let area = 0

  for (let i = 1; i < curve.length; i++) {
    const deltaStrain = curve[i].strain - curve[i - 1].strain
    const avgStress = (curve[i].stress + curve[i - 1].stress) / 2
    area += avgStress * deltaStrain
  }

  return area
}
