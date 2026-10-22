export type PredictionLimits = {
  temperature: { min: number; max: number }
  speed: { min: number; max: number }
}

export const DEFAULT_LIMITS: PredictionLimits = {
  temperature: { min: 190, max: 220 },
  speed: { min: 90, max: 100 },
}

function smallestLevelSpacing(levels: number[]) {
  const sorted = [...new Set(levels)].sort((a, b) => a - b)
  const gaps = sorted.slice(1).map((level, index) => level - sorted[index])
  return gaps.length ? Math.min(...gaps) : 0
}

function axisLimits(levels: number[], margin: number) {
  return { min: Math.min(...levels) - margin, max: Math.max(...levels) + margin }
}

export function testedLimits(points: { temperature: number; speed: number }[]): PredictionLimits {
  const temperatures = points.map((point) => point.temperature)
  const speeds = points.map((point) => point.speed)
  return {
    temperature: axisLimits(temperatures, 0),
    speed: axisLimits(speeds, 0),
  }
}

export function validatedLimits(
  points: { temperature: number; speed: number }[]
): PredictionLimits {
  const temperatures = points.map((point) => point.temperature)
  const speeds = points.map((point) => point.speed)
  return {
    temperature: axisLimits(temperatures, smallestLevelSpacing(temperatures)),
    speed: axisLimits(speeds, smallestLevelSpacing(speeds)),
  }
}
