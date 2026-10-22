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

export function predictExperimentalCurve(
  input: PredictionInput,
  trainingData: RambergOsgoodTrainingPoint[]
): ExperimentalPrediction | null {
  const profiles = trainingData.filter((profile) => profile.runs?.length)
  if (!profiles.length) return null

  const weights = profileWeights(input, profiles)
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
  if (!(weightSum > 0)) return null

  const runs = profiles.flatMap((profile, index) => {
    const profileRuns = profile.runs ?? []
    return profileRuns.map((run) => ({
      run,
      weight: weights[index] / profileRuns.length,
    }))
  })

  const estimate = (entries: typeof runs, read: (run: ExperimentalRun) => number): Estimate => {
    const total = entries.reduce((sum, entry) => sum + entry.weight, 0)
    const mean = entries.reduce((sum, entry) => sum + entry.weight * read(entry.run), 0) / total
    const variance =
      entries.reduce((sum, entry) => sum + entry.weight * (read(entry.run) - mean) ** 2, 0) / total
    return { mean, deviation: Math.sqrt(variance) }
  }

  const lastIndex = NORMALIZED_POINTS - 1
  const peakStrain = estimate(runs, (run) => run.peakStrain)
  const curve = Array.from({ length: NORMALIZED_POINTS }, (_, index) => {
    const { mean, deviation } = estimate(runs, (run) => run.normalizedStress[index])
    return { strain: (index / lastIndex) * peakStrain.mean, stress: mean, deviation }
  })
  const runsWithModulus = runs.filter((entry) => entry.run.modulus !== null)

  return {
    curve,
    ultimateStress: estimate(runs, (run) => run.normalizedStress[lastIndex]),
    peakStrain,
    modulus: runsWithModulus.length ? estimate(runsWithModulus, (run) => run.modulus ?? 0) : null,
    toughness: calculatePropertiesFromCurve(curve).toughness,
    sources: profiles
      .map((profile, index) => ({
        profile: profile.profile,
        temperature: profile.temperature,
        speed: profile.speed,
        weight: weights[index] / weightSum,
      }))
      .sort((a, b) => b.weight - a.weight),
  }
}
