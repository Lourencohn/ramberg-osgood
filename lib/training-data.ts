import type { RambergOsgoodTrainingPoint, StressStrainPoint } from '@/types'
import { fitRambergOsgoodCurve, seedFromString } from '@/lib/ramberg-osgood-fit'

/**
 * Montagem de um ponto de treinamento do metamodelo a partir dos ensaios de um perfil.
 *
 * Usada tanto pela plataforma (dados do banco) quanto pelo script de análise do TCC
 * (dados de data/), para que os dois caminhos produzam exatamente os mesmos parâmetros.
 */

const MAX_POINTS_PER_TEST = 600
const FIT_SAMPLE_SIZE = 400
const VALIDATION_POINTS = 400

export interface ProfileTests {
  profile: string
  temperature: number
  speed: number
  /** trecho ascendente de cada ensaio (origem até a tensão máxima), já corrigido */
  tests: StressStrainPoint[][]
}

export function downsample<T>(points: T[], maxPoints: number): T[] {
  if (points.length <= maxPoints) return points
  const step = Math.ceil(points.length / maxPoints)
  return points.filter((_, index) => index % step === 0)
}

/** Recorta o trecho ascendente (do início até o ponto de tensão máxima). */
export function ascendingBranch(points: StressStrainPoint[]): StressStrainPoint[] {
  if (!points.length) return points
  let maxIndex = 0
  points.forEach((point, index) => {
    if (point.stress > points[maxIndex].stress) maxIndex = index
  })
  return points.slice(0, maxIndex + 1)
}

export function buildTrainingPoint(entry: ProfileTests): RambergOsgoodTrainingPoint | null {
  const curves = entry.tests
    .map((curve) => curve.filter((point) => point.stress > 0 && point.strain >= 0))
    .filter((curve) => curve.length >= 10)
  if (!curves.length) return null

  const points: StressStrainPoint[] = []
  const maxStrains: number[] = []
  for (const curve of curves) {
    const trimmed = downsample(curve, MAX_POINTS_PER_TEST)
    points.push(...trimmed)
    maxStrains.push(Math.max(...trimmed.map((point) => point.strain)))
  }

  const maxStrain = maxStrains.reduce((sum, value) => sum + value, 0) / maxStrains.length
  const fit = fitRambergOsgoodCurve(points, {
    seed: seedFromString(entry.profile),
    sampleSize: Math.min(FIT_SAMPLE_SIZE, points.length),
    curvePoints: 120,
    maxStrain,
  })

  const validationPoints = downsample(points, VALIDATION_POINTS)
    .filter((point) => point.stress > 0 && point.strain >= 0)
    .sort((a, b) => a.strain - b.strain)

  return {
    profile: entry.profile,
    temperature: entry.temperature,
    speed: entry.speed,
    E: fit.params.E,
    sigma_0: fit.params.sigma_0,
    n: fit.params.n,
    maxStrain,
    rmse: fit.rmse,
    pointsUsed: fit.pointsUsed,
    validationPoints,
  }
}
