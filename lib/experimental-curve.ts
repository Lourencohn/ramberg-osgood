import type {
  Estimate,
  ExperimentalPrediction,
  ExperimentalRun,
  PredictionInput,
  RambergOsgoodTrainingPoint,
  StressStrainPoint,
} from '@/types'
import { profileWeights } from '@/lib/metamodel'
import { calculatePropertiesFromCurve } from '@/lib/mechanical-properties'
import { findLinearRegion } from '@/lib/tensile-processing'

const NORMALIZED_POINTS = 101
const DISPLAY_POINTS = 80

const roundTo = (value: number, decimals: number) => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function stressAtStrain(curve: StressStrainPoint[], strain: number): number {
  if (strain <= curve[0].strain) return curve[0].stress
  for (let i = 1; i < curve.length; i += 1) {
    const current = curve[i]
    if (current.strain < strain) continue
    const previous = curve[i - 1]
    const span = current.strain - previous.strain
    const t = span > 0 ? (strain - previous.strain) / span : 1
    return previous.stress + t * (current.stress - previous.stress)
  }
  return curve[curve.length - 1].stress
}

function apparentModulus(ascending: StressStrainPoint[]): number | null {
  try {
    return findLinearRegion(ascending).slope
  } catch {
    return null
  }
}

function thinPreservingPeak(points: StressStrainPoint[], peakIndex: number, maxPoints: number) {
  if (points.length <= maxPoints) return points
  const step = Math.ceil(points.length / maxPoints)
  return points.filter(
    (_, index) => index % step === 0 || index === peakIndex || index === points.length - 1
  )
}

export function buildExperimentalRun(
  specimen: string,
  points: StressStrainPoint[]
): ExperimentalRun | null {
  const curve = points.filter(
    (point) =>
      Number.isFinite(point.strain) &&
      Number.isFinite(point.stress) &&
      point.strain >= 0 &&
      point.stress >= 0
  )
  if (curve.length < 10) return null

  const peakIndex = curve.reduce(
    (best, point, index) => (point.stress > curve[best].stress ? index : best),
    0
  )
  const ascending = curve.slice(0, peakIndex + 1)
  const peakStrain = ascending[ascending.length - 1].strain
  if (!(peakStrain > 0)) return null

  const normalizedStress = Array.from({ length: NORMALIZED_POINTS }, (_, index) =>
    roundTo(stressAtStrain(ascending, (index / (NORMALIZED_POINTS - 1)) * peakStrain), 3)
  )

  return {
    specimen,
    peakStrain,
    modulus: apparentModulus(ascending),
    normalizedStress,
    points: thinPreservingPeak(curve, peakIndex, DISPLAY_POINTS).map((point) => ({
      strain: roundTo(point.strain, 6),
      stress: roundTo(point.stress, 3),
    })),
  }
}

function predictEstimate(
  input: PredictionInput,
  profiles: RambergOsgoodTrainingPoint[],
  read: (run: ExperimentalRun) => number | null
): Estimate | null {
  const groups = profiles
    .map((profile) => ({
      profile,
      values: (profile.runs ?? [])
        .map(read)
        .filter((value): value is number => value !== null && Number.isFinite(value)),
    }))
    .filter((group) => group.values.length)
  if (!groups.length) return null

  const weights = profileWeights(
    input,
    groups.map((group) => group.profile)
  )
  const means = groups.map(
    (group) => group.values.reduce((sum, value) => sum + value, 0) / group.values.length
  )
  const mean = means.reduce((sum, value, index) => sum + weights[index] * value, 0)
  const replicateDegrees = groups.reduce((sum, group) => sum + group.values.length - 1, 0)
  const replicateSquares = groups.reduce(
    (sum, group, index) =>
      sum + group.values.reduce((acc, value) => acc + (value - means[index]) ** 2, 0),
    0
  )
  const replicateVariance = replicateDegrees > 0 ? replicateSquares / replicateDegrees : 0
  const estimateVarianceFactor = groups.reduce(
    (sum, group, index) => sum + weights[index] ** 2 / group.values.length,
    0
  )
  return { mean, deviation: Math.sqrt(replicateVariance * (1 + estimateVarianceFactor)) }
}

export function predictExperimentalCurve(
  input: PredictionInput,
  trainingData: RambergOsgoodTrainingPoint[]
): ExperimentalPrediction | null {
  const profiles = trainingData.filter((profile) => profile.runs?.length)
  if (!profiles.length) return null

  const estimate = (read: (run: ExperimentalRun) => number | null) =>
    predictEstimate(input, profiles, read)
  const lastIndex = NORMALIZED_POINTS - 1
  const peakStrain = estimate((run) => run.peakStrain)
  const ultimateStress = estimate((run) => run.normalizedStress[lastIndex])
  if (!peakStrain || !ultimateStress || !(peakStrain.mean > 0)) return null

  const curve = Array.from({ length: NORMALIZED_POINTS }, (_, index) => {
    const { mean, deviation } = estimate((run) => run.normalizedStress[index]) ?? {
      mean: 0,
      deviation: 0,
    }
    return { strain: (index / lastIndex) * peakStrain.mean, stress: mean, deviation }
  })
  const weights = profileWeights(input, profiles)

  return {
    curve,
    ultimateStress,
    peakStrain,
    modulus: estimate((run) => run.modulus),
    toughness: calculatePropertiesFromCurve(curve).toughness,
    sources: profiles
      .map((profile, index) => ({
        profile: profile.profile,
        temperature: profile.temperature,
        speed: profile.speed,
        weight: weights[index],
      }))
      .sort((a, b) => b.weight - a.weight),
  }
}
