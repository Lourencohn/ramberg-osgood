import type { PredictionInput, RambergOsgoodParams, RambergOsgoodTrainingPoint } from "@/types"

type InterpolationResult = RambergOsgoodParams & { maxStrain: number }

function normalize(value: number, min: number, max: number) {
  if (max === min) return 0
  return (value - min) / (max - min)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function computeRanges(points: RambergOsgoodTrainingPoint[]) {
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

function computeEpsilon(
  points: RambergOsgoodTrainingPoint[],
  ranges: ReturnType<typeof computeRanges>,
) {
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

function rbfWeights(
  input: PredictionInput,
  points: RambergOsgoodTrainingPoint[],
) {
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

function interpolateValue(
  points: RambergOsgoodTrainingPoint[],
  weights: number[],
  getter: (point: RambergOsgoodTrainingPoint) => number,
  min: number,
  max: number,
) {
  if (!points.length) return min
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
  if (!weightSum) return clamp(getter(points[0]), min, max)
  const value =
    points.reduce((sum, point, index) => sum + getter(point) * weights[index], 0) / weightSum
  return clamp(value, min, max)
}


export function polynomialInterpolation(
  input: PredictionInput,
  data: RambergOsgoodTrainingPoint[],
): InterpolationResult {
  return rbfInterpolation(input, data)
}


export function rbfInterpolation(
  input: PredictionInput,
  data: RambergOsgoodTrainingPoint[],
): InterpolationResult {
  if (!data.length) {
    return { E: 3000, sigma_0: 50, n: 8, maxStrain: 0.08 }
  }

  const exactMatch = data.find(
    (point) => point.temperature === input.temperature && point.speed === input.speed,
  )
  if (exactMatch) {
    return {
      E: exactMatch.E,
      sigma_0: exactMatch.sigma_0,
      n: exactMatch.n,
      maxStrain: exactMatch.maxStrain,
    }
  }

  const weights = rbfWeights(input, data)
  const bounds = computeBounds(data)

  return {
    E: interpolateValue(data, weights, (point) => point.E, bounds.E[0], bounds.E[1]),
    sigma_0: interpolateValue(data, weights, (point) => point.sigma_0, bounds.sigma_0[0], bounds.sigma_0[1]),
    n: interpolateValue(data, weights, (point) => point.n, bounds.n[0], bounds.n[1]),
    maxStrain: interpolateValue(
      data,
      weights,
      (point) => point.maxStrain,
      bounds.maxStrain[0],
      bounds.maxStrain[1],
    ),
  }
}
