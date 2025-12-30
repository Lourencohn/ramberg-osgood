import type { PredictionInput, PredictionResult, RambergOsgoodTrainingPoint } from "@/types"
import { polynomialInterpolation, rbfInterpolation } from "./metamodel"
import { generateStressStrainCurve } from "./ramberg-osgood"
import { calculateMechanicalProperties } from "./mechanical-properties"

/**
 * Executa a previsão completa de propriedades mecânicas
 *
 * @param input - Parâmetros de entrada do usuário
 * @param method - Método de interpolação ('polynomial' ou 'rbf')
 * @returns Resultado completo da previsão
 */
export async function predictProperties(
  input: PredictionInput,
  trainingData: RambergOsgoodTrainingPoint[],
  method: "polynomial" | "rbf" = "rbf",
): Promise<PredictionResult> {
  // 1. Interpolar parâmetros de Ramberg-Osgood a partir dos ensaios reais
  const interpolation = method === "polynomial"
    ? polynomialInterpolation(input, trainingData)
    : rbfInterpolation(input, trainingData)
  const rambergOsgood = {
    E: interpolation.E,
    sigma_0: interpolation.sigma_0,
    n: interpolation.n,
  }

  // 2. Gerar curva tensão-deformação
  const maxStrain = interpolation.maxStrain > 0 ? interpolation.maxStrain : 0.08
  const curve = generateStressStrainCurve(rambergOsgood, maxStrain, 140)

  // 3. Calcular propriedades mecânicas
  const properties = calculateMechanicalProperties(rambergOsgood, curve)

  return {
    input,
    rambergOsgood,
    properties,
    curve,
    interpolationMethod: method,
  }
}
