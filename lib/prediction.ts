import type { PredictionInput, PredictionResult, RambergOsgoodTrainingPoint } from '@/types'
import { polynomialInterpolation, rbfInterpolation } from './metamodel'
import { generateStressStrainCurve } from './ramberg-osgood'
import { calculateMechanicalProperties } from './mechanical-properties'

export async function predictProperties(
  input: PredictionInput,
  trainingData: RambergOsgoodTrainingPoint[],
  options: {
    method?: 'polynomial' | 'rbf'
    curvePoints?: number
  } = {}
): Promise<PredictionResult> {
  const method = options.method ?? 'rbf'
  const curvePoints = options.curvePoints ?? 180
  const interpolation =
    method === 'polynomial'
      ? polynomialInterpolation(input, trainingData)
      : rbfInterpolation(input, trainingData)
  const rambergOsgood = {
    E: interpolation.E,
    sigma_0: interpolation.sigma_0,
    n: interpolation.n,
  }

  const maxStrain = interpolation.maxStrain > 0 ? interpolation.maxStrain : 0.08
  const curve = generateStressStrainCurve(rambergOsgood, maxStrain, curvePoints)

  const properties = calculateMechanicalProperties(rambergOsgood, maxStrain)

  return {
    input,
    rambergOsgood,
    properties,
    curve,
    interpolationMethod: method,
  }
}
