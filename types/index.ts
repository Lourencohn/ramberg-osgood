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

export interface PredictionResult {
  input: PredictionInput
  rambergOsgood: RambergOsgoodParams
  properties: MechanicalProperties
  curve: StressStrainPoint[]
  interpolationMethod: 'polynomial' | 'rbf'
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}
