import type { PredictionInput, PredictionResult, RambergOsgoodTrainingPoint } from '@/types'
import { rbfCurveInterpolation } from './metamodel'
import { fitRambergOsgoodCurve, seedFromString } from './ramberg-osgood-fit'
import { calculatePropertiesFromCurve } from './mechanical-properties'
import { predictExperimentalCurve } from './experimental-curve'

export async function predictProperties(
  input: PredictionInput,
  trainingData: RambergOsgoodTrainingPoint[],
  options: {
    curvePoints?: number
  } = {}
): Promise<PredictionResult> {
  const curvePoints = options.curvePoints ?? 180
  const { curve } = rbfCurveInterpolation(input, trainingData, curvePoints)

  const fit = fitRambergOsgoodCurve(curve, {
    seed: seedFromString(`${input.temperature}-${input.speed}`),
    sampleSize: Math.min(400, curve.length),
  })

  return {
    input,
    rambergOsgood: fit.params,
    properties: calculatePropertiesFromCurve(curve),
    curve,
    experimental: predictExperimentalCurve(input, trainingData),
  }
}
