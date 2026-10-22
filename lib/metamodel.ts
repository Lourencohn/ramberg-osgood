import type {
  PredictionInput,
  RambergOsgoodParams,
  RambergOsgoodTrainingPoint,
  StressStrainPoint,
} from '@/types'
import { calculateStress } from '@/lib/ramberg-osgood'

type PredictedParameters = RambergOsgoodParams & { maxStrain: number }

interface ProcessCoordinates {
  temperature: number
  speed: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function weightedSum(weights: number[], values: number[]) {
  return values.reduce((sum, value, index) => sum + value * weights[index], 0)
}

function isValidTrainingPoint(point: RambergOsgoodTrainingPoint) {
  return [point.temperature, point.speed, point.E, point.sigma_0, point.n, point.maxStrain].every(
    (value) => Number.isFinite(value) && value > 0
  )
}

function solveLinearSystem(matrix: number[][], rhs: number[]): number[] | null {
  const size = rhs.length
  const augmented = matrix.map((row, index) => [...row, rhs[index]])
  for (let column = 0; column < size; column += 1) {
    let pivot = column
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row
    }
    if (Math.abs(augmented[pivot][column]) < 1e-12) return null
    ;[augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]]
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue
      const factor = augmented[row][column] / augmented[column][column]
      for (let k = column; k <= size; k += 1) augmented[row][k] -= factor * augmented[column][k]
    }
  }
  return augmented.map((row, index) => row[size] / row[index])
}

function linearBasis(points: ProcessCoordinates[]) {
  const temperatures = points.map((point) => point.temperature)
  const speeds = points.map((point) => point.speed)
  const temperatureVaries = Math.max(...temperatures) > Math.min(...temperatures)
  const speedVaries = Math.max(...speeds) > Math.min(...speeds)
  const temperatureCenter = average(temperatures)
  const speedCenter = average(speeds)
  return (point: ProcessCoordinates) => [
    1,
    ...(temperatureVaries ? [point.temperature - temperatureCenter] : []),
    ...(speedVaries ? [point.speed - speedCenter] : []),
  ]
}

export function profileWeights(input: PredictionInput, points: ProcessCoordinates[]): number[] {
  if (!points.length) return []
  const basis = linearBasis(points)
  const rows = points.map(basis)
  const size = rows[0].length
  const uniform = points.map(() => 1 / points.length)
  if (points.length < size) return uniform
  const normalMatrix = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => rows.reduce((sum, row) => sum + row[i] * row[j], 0))
  )
  const solution = solveLinearSystem(normalMatrix, basis(input))
  if (!solution) return uniform
  return rows.map((row) => weightedSum(solution, row))
}

export function predictScalar(
  input: PredictionInput,
  points: ProcessCoordinates[],
  values: number[]
): number {
  if (!points.length || points.length !== values.length) {
    throw new Error('Pontos e valores de treinamento incompatíveis')
  }
  return weightedSum(profileWeights(input, points), values)
}

export function predictParameters(
  input: PredictionInput,
  data: RambergOsgoodTrainingPoint[]
): PredictedParameters {
  const validData = data.filter(isValidTrainingPoint)
  if (!validData.length) {
    return { E: 3000, sigma_0: 50, n: 8, maxStrain: 0.08 }
  }

  const weights = profileWeights(input, validData)
  const predictWithinObserved = (getter: (point: RambergOsgoodTrainingPoint) => number) => {
    const values = validData.map(getter)
    return clamp(weightedSum(weights, values), Math.min(...values), Math.max(...values))
  }

  return {
    E: predictWithinObserved((point) => point.E),
    sigma_0: predictWithinObserved((point) => point.sigma_0),
    n: predictWithinObserved((point) => point.n),
    maxStrain: predictWithinObserved((point) => point.maxStrain),
  }
}

export function predictCurve(
  input: PredictionInput,
  data: RambergOsgoodTrainingPoint[],
  points = 180
): { curve: StressStrainPoint[]; maxStrain: number } {
  const validData = data.filter(isValidTrainingPoint)
  if (!validData.length) return { curve: [], maxStrain: 0 }

  const weights = profileWeights(input, validData)
  const maxStrain = weightedSum(
    weights,
    validData.map((point) => point.maxStrain)
  )
  if (!(maxStrain > 0)) return { curve: [], maxStrain: 0 }

  const curve: StressStrainPoint[] = []
  for (let i = 0; i <= points; i += 1) {
    const u = i / points
    const stress = weightedSum(
      weights,
      validData.map((point) => calculateStress(u * point.maxStrain, point))
    )
    if (!(stress >= 0)) return { curve: [], maxStrain: 0 }
    curve.push({ strain: u * maxStrain, stress })
  }
  return { curve, maxStrain }
}
