/**
 * Parâmetros de entrada do usuário
 */
export interface PredictionInput {
  temperature: number // Temperatura de impressão (°C)
  speed: number // Velocidade de impressão (mm/s)
}

/**
 * Parâmetros do modelo de Ramberg-Osgood
 */
export interface RambergOsgoodParams {
  E: number // Módulo de elasticidade (MPa)
  sigma_0: number // Tensão de referência (MPa)
  n: number // Expoente de encruamento
}

/**
 * Dados reais de treinamento para Ramberg-Osgood
 */
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

/**
 * Propriedades mecânicas calculadas
 */
export interface MechanicalProperties {
  yieldStress: number // Tensão de escoamento (MPa)
  ultimateStress: number // Tensão máxima (MPa)
  ductility: number // Ductilidade (%)
  resilience: number // Resiliência (MJ/m³)
  toughness: number // Tenacidade (MJ/m³)
}

/**
 * Ponto da curva tensão-deformação
 */
export interface StressStrainPoint {
  strain: number // ε (deformação)
  stress: number // σ (tensão, MPa)
}

/**
 * Resultado completo da previsão
 */
export interface PredictionResult {
  input: PredictionInput
  rambergOsgood: RambergOsgoodParams
  properties: MechanicalProperties
  curve: StressStrainPoint[]
  interpolationMethod: "polynomial" | "rbf"
}

/**
 * Resultado da validação de entrada
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}
