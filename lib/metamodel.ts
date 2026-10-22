import type {
  PredictionInput,
  RambergOsgoodParams,
  RambergOsgoodTrainingPoint,
  StressStrainPoint,
} from '@/types'
import { calculateStress } from '@/lib/ramberg-osgood'

type InterpolationResult = RambergOsgoodParams & { maxStrain: number }

interface ProcessCoordinates {
  temperature: number
  speed: number
}

function normalize(value: number, min: number, max: number) {
  if (max === min) return 0
  return (value - min) / (max - min)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function computeRanges(points: ProcessCoordinates[]) {
  const temperatures = points.map((point) => point.temperature)
  const speeds = points.map((point) => point.speed)
  return {
    tempMin: Math.min(...temperatures),
    tempMax: Math.max(...temperatures),
    speedMin: Math.min(...speeds),
    speedMax: Math.max(...speeds),
  }
}

function computeBounds(points: RambergOsgoodTrainingPoint[]) {
  const values = {
    E: points.map((point) => point.E),
    sigma_0: points.map((point) => point.sigma_0),
    n: points.map((point) => point.n),
    maxStrain: points.map((point) => point.maxStrain),
  }

  return {
    E: [Math.min(...values.E), Math.max(...values.E)] as const,
    sigma_0: [Math.min(...values.sigma_0), Math.max(...values.sigma_0)] as const,
    n: [Math.min(...values.n), Math.max(...values.n)] as const,
    maxStrain: [Math.min(...values.maxStrain), Math.max(...values.maxStrain)] as const,
  }
}

function computeEpsilon(points: ProcessCoordinates[], ranges: ReturnType<typeof computeRanges>) {
  if (points.length < 2) return 1
  let sum = 0
  let count = 0
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const dx =
        normalize(points[i].temperature, ranges.tempMin, ranges.tempMax) -
        normalize(points[j].temperature, ranges.tempMin, ranges.tempMax)
      const dy =
        normalize(points[i].speed, ranges.speedMin, ranges.speedMax) -
        normalize(points[j].speed, ranges.speedMin, ranges.speedMax)
      sum += Math.sqrt(dx * dx + dy * dy)
      count += 1
    }
  }
  const meanDist = count ? sum / count : 1
  return meanDist > 0 ? 1 / meanDist : 1
}

function rbfWeights(input: PredictionInput, points: ProcessCoordinates[]) {
  if (!points.length) return []
  const ranges = computeRanges(points)
  const inputTemp = normalize(input.temperature, ranges.tempMin, ranges.tempMax)
  const inputSpeed = normalize(input.speed, ranges.speedMin, ranges.speedMax)
  const epsilon = computeEpsilon(points, ranges)

  return points.map((point) => {
    const dx = inputTemp - normalize(point.temperature, ranges.tempMin, ranges.tempMax)
    const dy = inputSpeed - normalize(point.speed, ranges.speedMin, ranges.speedMax)
    const dist = Math.sqrt(dx * dx + dy * dy)
    return Math.exp(-Math.pow(epsilon * dist, 2))
  })
}

export function profileWeights(input: PredictionInput, points: ProcessCoordinates[]): number[] {
  const exactIndex = points.findIndex(
    (point) => point.temperature === input.temperature && point.speed === input.speed
  )
  if (exactIndex >= 0) return points.map((_, index) => (index === exactIndex ? 1 : 0))
  return rbfWeights(input, points)
}

function interpolateValue(
  points: RambergOsgoodTrainingPoint[],
  weights: number[],
  getter: (point: RambergOsgoodTrainingPoint) => number,
  min: number,
  max: number
) {
  if (!points.length) return min
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
  if (!weightSum) return clamp(getter(points[0]), min, max)
  const value =
    points.reduce((sum, point, index) => sum + getter(point) * weights[index], 0) / weightSum
  return clamp(value, min, max)
}

export function rbfInterpolateScalar(
  input: PredictionInput,
  points: ProcessCoordinates[],
  values: number[]
): number {
  if (!points.length || points.length !== values.length) {
    throw new Error('Pontos e valores de treinamento incompatíveis')
  }
  const exactIndex = points.findIndex(
    (point) => point.temperature === input.temperature && point.speed === input.speed
  )
  if (exactIndex >= 0) return values[exactIndex]
  const weights = rbfWeights(input, points)
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (!weightSum) return clamp(values[0], min, max)
  const value = values.reduce((sum, v, index) => sum + v * weights[index], 0) / weightSum
  return clamp(value, min, max)
}

export function rbfInterpolation(
  input: PredictionInput,
  data: RambergOsgoodTrainingPoint[]
): InterpolationResult {
  const validData = data.filter(
    (point) =>
      Number.isFinite(point.temperature) &&
      point.temperature > 0 &&
      Number.isFinite(point.speed) &&
      point.speed > 0 &&
      Number.isFinite(point.E) &&
      point.E > 0 &&
      Number.isFinite(point.sigma_0) &&
      point.sigma_0 > 0 &&
      Number.isFinite(point.n) &&
      point.n > 0 &&
      Number.isFinite(point.maxStrain) &&
      point.maxStrain > 0
  )

  if (!validData.length) {
    return { E: 3000, sigma_0: 50, n: 8, maxStrain: 0.08 }
  }

  const exactMatch = validData.find(
    (point) => point.temperature === input.temperature && point.speed === input.speed
  )
  if (exactMatch) {
    return {
      E: exactMatch.E,
      sigma_0: exactMatch.sigma_0,
      n: exactMatch.n,
      maxStrain: exactMatch.maxStrain,
    }
  }

  const weights = rbfWeights(input, validData)
  const bounds = computeBounds(validData)

  return {
    E: interpolateValue(validData, weights, (point) => point.E, bounds.E[0], bounds.E[1]),
    sigma_0: interpolateValue(
      validData,
      weights,
      (point) => point.sigma_0,
      bounds.sigma_0[0],
      bounds.sigma_0[1]
    ),
    n: interpolateValue(validData, weights, (point) => point.n, bounds.n[0], bounds.n[1]),
    maxStrain: interpolateValue(
      validData,
      weights,
      (point) => point.maxStrain,
      bounds.maxStrain[0],
      bounds.maxStrain[1]
    ),
  }
}

export function rbfCurveInterpolation(
  input: PredictionInput,
  data: RambergOsgoodTrainingPoint[],
  points = 180
): { curve: StressStrainPoint[]; maxStrain: number } {
  const validData = data.filter(
    (point) =>
      Number.isFinite(point.temperature) &&
      Number.isFinite(point.speed) &&
      point.E > 0 &&
      point.sigma_0 > 0 &&
      point.n > 0 &&
      point.maxStrain > 0
  )
  if (!validData.length) return { curve: [], maxStrain: 0 }

  const weights = profileWeights(input, validData)
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0) || 1
  const maxStrain =
    validData.reduce((sum, point, index) => sum + point.maxStrain * weights[index], 0) / weightSum

  const curve: StressStrainPoint[] = []
  for (let i = 0; i <= points; i += 1) {
    const u = i / points
    const stress =
      validData.reduce(
        (sum, point, index) => sum + calculateStress(u * point.maxStrain, point) * weights[index],
        0
      ) / weightSum
    curve.push({ strain: u * maxStrain, stress })
  }
  return { curve, maxStrain }
}
