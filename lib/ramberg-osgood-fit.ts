import type { RambergOsgoodParams, StressStrainPoint } from "@/types"
import { calculateStrain, generateStressStrainCurve } from "./ramberg-osgood"

export interface RambergOsgoodFitOptions {
  iterations?: number
  restarts?: number
  seed?: number
  sampleSize?: number
  curvePoints?: number
  maxStrain?: number
  bounds?: {
    E?: [number, number]
    sigma_0?: [number, number]
    n?: [number, number]
  }
}

export interface RambergOsgoodFitResult {
  params: RambergOsgoodParams
  rmse: number
  iterations: number
  pointsUsed: number
  curve: StressStrainPoint[]
  fittedPoints: StressStrainPoint[]
}

const DEFAULT_BOUNDS = {
  E: [500, 10000],
  sigma_0: [5, 200],
  n: [1, 30],
} satisfies Required<NonNullable<RambergOsgoodFitOptions["bounds"]>>

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function createRng(seed?: number) {
  let state = seed ?? Math.floor(Math.random() * 2 ** 32)
  return () => {
    state = (state * 1664525 + 1013904223) % 2 ** 32
    return state / 2 ** 32
  }
}

function randomNormal(rng: () => number): number {
  let u = 0
  let v = 0
  while (u === 0) u = rng()
  while (v === 0) v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function sanitizePoints(points: StressStrainPoint[]) {
  return points
    .filter((point) => Number.isFinite(point.stress) && Number.isFinite(point.strain))
    .filter((point) => point.stress > 0 && point.strain >= 0)
    .sort((a, b) => a.strain - b.strain)
}

function samplePoints(points: StressStrainPoint[], sampleSize: number): StressStrainPoint[] {
  if (points.length <= sampleSize) return points
  const step = Math.max(1, Math.floor(points.length / sampleSize))
  const sampled: StressStrainPoint[] = []
  for (let i = 0; i < points.length; i += step) {
    sampled.push(points[i])
    if (sampled.length >= sampleSize) break
  }
  return sampled
}

function estimateElasticModulus(points: StressStrainPoint[]): number {
  const smallStrain = points.filter((point) => point.strain > 0 && point.strain <= 0.002)
  const base = smallStrain.length >= 5 ? smallStrain : points.slice(0, Math.min(10, points.length))
  const ratios = base
    .map((point) => point.stress / point.strain)
    .filter((value) => Number.isFinite(value) && value > 0)
  if (!ratios.length) return 3000
  return ratios.reduce((sum, value) => sum + value, 0) / ratios.length
}

function estimateSigma0(points: StressStrainPoint[]): number {
  let closest: StressStrainPoint | null = null
  let closestDiff = Number.POSITIVE_INFINITY
  for (const point of points) {
    if (point.strain <= 0) continue
    const diff = Math.abs(point.strain - 0.002)
    if (diff < closestDiff) {
      closest = point
      closestDiff = diff
    }
  }
  if (closest) return closest.stress
  const maxStress = Math.max(...points.map((point) => point.stress))
  return Number.isFinite(maxStress) ? maxStress * 0.6 : 50
}

function loss(params: RambergOsgoodParams, points: StressStrainPoint[]) {
  let error = 0
  let count = 0
  for (const point of points) {
    const predicted = calculateStrain(point.stress, params)
    const diff = predicted - point.strain
    error += diff * diff
    count += 1
  }
  return { error, count }
}

function createRandomParams(
  rng: () => number,
  bounds: Required<NonNullable<RambergOsgoodFitOptions["bounds"]>>,
): RambergOsgoodParams {
  const randInRange = (min: number, max: number) => min + rng() * (max - min)
  return {
    E: randInRange(bounds.E[0], bounds.E[1]),
    sigma_0: randInRange(bounds.sigma_0[0], bounds.sigma_0[1]),
    n: randInRange(bounds.n[0], bounds.n[1]),
  }
}

function clampParams(
  params: RambergOsgoodParams,
  bounds: Required<NonNullable<RambergOsgoodFitOptions["bounds"]>>,
): RambergOsgoodParams {
  return {
    E: clamp(params.E, bounds.E[0], bounds.E[1]),
    sigma_0: clamp(params.sigma_0, bounds.sigma_0[0], bounds.sigma_0[1]),
    n: clamp(params.n, bounds.n[0], bounds.n[1]),
  }
}

export function fitRambergOsgoodCurve(
  points: StressStrainPoint[],
  options: RambergOsgoodFitOptions = {},
): RambergOsgoodFitResult {
  const sanitized = sanitizePoints(points)
  if (!sanitized.length) {
    return {
      params: { E: 3000, sigma_0: 50, n: 8 },
      rmse: 0,
      iterations: 0,
      pointsUsed: 0,
      curve: [],
      fittedPoints: [],
    }
  }

  const rng = createRng(options.seed)
  const bounds = {
    E: options.bounds?.E ?? DEFAULT_BOUNDS.E,
    sigma_0: options.bounds?.sigma_0 ?? DEFAULT_BOUNDS.sigma_0,
    n: options.bounds?.n ?? DEFAULT_BOUNDS.n,
  }

  const sampleSize = options.sampleSize ?? Math.min(400, sanitized.length)
  const sample = samplePoints(sanitized, sampleSize)

  const initialParams = clampParams(
    {
      E: estimateElasticModulus(sample),
      sigma_0: estimateSigma0(sample),
      n: 8,
    },
    bounds,
  )

  const totalIterations = options.iterations ?? 3000
  const restarts = Math.max(1, options.restarts ?? 3)
  const iterationsPerRun = Math.max(1, Math.floor(totalIterations / restarts))

  let bestParams = initialParams
  let bestResult = loss(bestParams, sample)

  for (let run = 0; run < restarts; run += 1) {
    let params = run === 0 ? initialParams : createRandomParams(rng, bounds)
    let result = loss(params, sample)
    let step = 0.25

    for (let i = 0; i < iterationsPerRun; i += 1) {
      const candidate = clampParams(
        {
          E: params.E * (1 + randomNormal(rng) * step),
          sigma_0: params.sigma_0 * (1 + randomNormal(rng) * step),
          n: params.n * (1 + randomNormal(rng) * step),
        },
        bounds,
      )

      const candidateResult = loss(candidate, sample)
      if (candidateResult.error < result.error) {
        params = candidate
        result = candidateResult
      }

      step *= 0.9995
    }

    if (result.error < bestResult.error) {
      bestParams = params
      bestResult = result
    }
  }

  const rmse = bestResult.count ? Math.sqrt(bestResult.error / bestResult.count) : 0
  const maxStrain = options.maxStrain ?? Math.max(...sanitized.map((point) => point.strain))
  const curvePoints = options.curvePoints ?? 120
  const curve = generateStressStrainCurve(bestParams, maxStrain, curvePoints)
  const fittedPoints = sample.map((point) => ({
    strain: calculateStrain(point.stress, bestParams),
    stress: point.stress,
  }))

  return {
    params: bestParams,
    rmse,
    iterations: iterationsPerRun * restarts,
    pointsUsed: sample.length,
    curve,
    fittedPoints,
  }
}
