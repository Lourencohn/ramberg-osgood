export interface PredictionInput {
  temperature: number
  speed: number
}

export interface RambergOsgoodParams {
  E: number
  sigma_0: number
  n: number
}

export interface RambergOsgoodTrainingPoint {
  profile: string
  temperature: number
  speed: number
  E: number
  sigma_0: number
  n: number
  maxStrain: number
  rmse: number
  pointsUsed: number
  validationPoints?: StressStrainPoint[]
  runs?: ExperimentalRun[]
}

export interface ExperimentalRun {
  specimen: string
  peakStrain: number
  modulus: number | null
  normalizedStress: number[]
  points: StressStrainPoint[]
}

export interface MechanicalProperties {
  yieldStress: number
  ultimateStress: number
  ductility: number
  resilience: number
  toughness: number
}

export interface StressStrainPoint {
  strain: number
  stress: number
}

export interface ExpectedCurvePoint extends StressStrainPoint {
  deviation: number
}

export interface CurveProperties {
  yieldStress: number | null
  ultimateStress: number
  ductility: number
  resilience: number | null
  toughness: number
  modulus: number
}

export interface Estimate {
  mean: number
  deviation: number
}

export interface ExperimentalPrediction {
  curve: ExpectedCurvePoint[]
  ultimateStress: Estimate
  peakStrain: Estimate
  modulus: Estimate | null
  toughness: number
  sources: Array<{ profile: string; temperature: number; speed: number; weight: number }>
}

export interface PredictionResult {
  input: PredictionInput
  rambergOsgood: RambergOsgoodParams
  properties: CurveProperties
  curve: StressStrainPoint[]
  experimental: ExperimentalPrediction | null
}
