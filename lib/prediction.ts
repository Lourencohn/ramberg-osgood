import type { PredictionInput, PredictionResult, RambergOsgoodTrainingPoint } from '@/types'
import { rbfCurveInterpolation } from './metamodel'
import { fitRambergOsgoodCurve, seedFromString } from './ramberg-osgood-fit'
import { calculatePropertiesFromCurve } from './mechanical-properties'

/**
 * Predição para uma combinação de temperatura e velocidade.
 *
 * 1. a curva prevista é interpolada no espaço das curvas (lib/metamodel.ts,
 *    rbfCurveInterpolation): média ponderada, com pesos RBF gaussianos, das curvas ajustadas de
 *    cada condição de treinamento, na deformação normalizada ε/ε_max;
 * 2. o modelo de Ramberg-Osgood é ajustado à curva prevista, para expor E, σ₀ e n;
 * 3. as propriedades são calculadas sobre a curva prevista.
 */
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
  const { modulus: _modulus, ...properties } = calculatePropertiesFromCurve(curve)

  return {
    input,
    rambergOsgood: fit.params,
    properties,
    curve,
  }
}
