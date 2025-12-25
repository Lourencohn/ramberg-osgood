import type { PredictionInput, PredictionResult } from "@/types"
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
  method: "polynomial" | "rbf" = "rbf",
): Promise<PredictionResult> {
  // Simular carga computacional (remover em produção)
  await new Promise((resolve) => setTimeout(resolve, 500))

  // 1. Interpolar parâmetros de Ramberg-Osgood
  const rambergOsgood = method === "polynomial" ? polynomialInterpolation(input) : rbfInterpolation(input)

  // 2. Gerar curva tensão-deformação
  const curve = generateStressStrainCurve(rambergOsgood)

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
