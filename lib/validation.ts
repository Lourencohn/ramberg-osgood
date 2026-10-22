export type PredictionLimits = {
  temperature: { min: number; max: number }
  speed: { min: number; max: number }
}

export const DEFAULT_LIMITS: PredictionLimits = {
  temperature: { min: 190, max: 220 },
  speed: { min: 90, max: 100 },
}
