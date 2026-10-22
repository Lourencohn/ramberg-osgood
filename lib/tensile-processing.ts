import type { StressStrainPoint } from '@/types'

/**
 * Processamento de ensaios de tração (ASTM D638) a partir do arquivo bruto da máquina.
 *
 * Etapas (as mesmas descritas no TCC, Seção 7.5):
 * 1. conversão para grandezas de engenharia: tensão = força / área medida do corpo de prova;
 *    deformação = deslocamento do travessão / comprimento de referência;
 * 2. sanitização: descarta pontos não numéricos, força negativa e deslocamento negativo;
 * 3. correção da região de acomodação (toe compensation, ASTM D638 Anexo A1): o trecho de
 *    maior inclinação da curva ascendente é localizado por regressão linear em janelas
 *    deslizantes (20% dos pontos entre 2% e 65% da tensão máxima); a reta é prolongada até
 *    tensão zero e esse ponto vira o novo zero de deformação; os pontos anteriores ao início do
 *    trecho linear (desvio da reta maior que 2% da tensão máxima) formam a região de acomodação
 *    e são substituídos pela reta a partir da origem;
 * 4. extração de propriedades: módulo aparente (inclinação da janela), tensão máxima,
 *    deformação na tensão máxima, deformação na ruptura (última deformação com tensão de pelo
 *    menos 50% da máxima), escoamento por offset de 0,2%, resiliência e tenacidade (regra dos
 *    trapézios até a ruptura);
 * 5. recorte do trecho ascendente (início do carregamento até a tensão máxima), usado no ajuste
 *    do modelo de Ramberg-Osgood.
 */

export interface MachineRecord {
  time: number
  displacement: number
  force: number
}

export interface SpecimenGeometry {
  gaugeLengthMm: number
  areaMm2: number
}

export interface EngineeringPoint extends StressStrainPoint {
  time: number
  displacement: number
  force: number
}

export interface CorrectedPoint extends EngineeringPoint {
  /** deformação de engenharia sem correção (deslocamento / L0) */
  rawStrain: number
}

export interface LinearRegion {
  slope: number
  intercept: number
  startIndex: number
  endIndex: number
  r2: number
}

export interface TensileProperties {
  /** módulo de elasticidade aparente (MPa), medido pelo deslocamento do travessão */
  apparentModulus: number
  maxStress: number
  strainAtMaxStress: number
  ruptureStrain: number
  /** escoamento convencional por offset de 0,2% (MPa); null se a curva não cruza a reta */
  offsetYieldStress: number | null
  /** σy² / 2E (MJ/m³) */
  resilience: number | null
  /** área sob a curva corrigida até a ruptura (MJ/m³) */
  toughness: number
  maxForce: number
}

export interface ProcessedTensileTest {
  geometry: SpecimenGeometry
  /** curva de engenharia completa, sem correção */
  engineering: EngineeringPoint[]
  /** curva corrigida da origem até a ruptura (o primeiro ponto é a origem) */
  corrected: CorrectedPoint[]
  /** trecho ascendente da curva corrigida, da origem até a tensão máxima */
  ascending: CorrectedPoint[]
  linearRegion: LinearRegion
  /** índice (na curva de engenharia) do primeiro ponto mantido após a acomodação */
  linearStartIndex: number
  /** deformação subtraída na correção de acomodação */
  toeOffset: number
  properties: TensileProperties
}

export interface ToeCompensationOptions {
  lowerFraction?: number
  upperFraction?: number
  windowFraction?: number
  minWindowPoints?: number
}

export const DEFAULT_TOE_OPTIONS: Required<ToeCompensationOptions> = {
  lowerFraction: 0.02,
  upperFraction: 0.65,
  windowFraction: 0.2,
  minWindowPoints: 5,
}

/** Tolerância (fração da tensão máxima) para estender o trecho linear para trás a partir da janela. */
export const LINEAR_TOLERANCE_FRACTION = 0.02
export const RUPTURE_STRESS_FRACTION = 0.5
export const YIELD_OFFSET_STRAIN = 0.002

/** Lê o .txt exportado pelo software da máquina (colunas: tempo, deslocamento, força). */
export function parseMachineFile(content: string): MachineRecord[] {
  const lines = content.replace(/\u0000/g, '').split(/\r?\n/)
  const records: MachineRecord[] = []
  for (const line of lines) {
    const parts = line.trim().split(/\s+/)
    if (parts.length < 3) continue
    const [time, displacement, force] = parts.slice(0, 3).map((value) => Number.parseFloat(value))
    if (![time, displacement, force].every(Number.isFinite)) continue
    records.push({ time, displacement, force })
  }
  return records
}

export function toEngineeringCurve(
  records: MachineRecord[],
  geometry: SpecimenGeometry
): EngineeringPoint[] {
  if (!(geometry.areaMm2 > 0) || !(geometry.gaugeLengthMm > 0)) {
    throw new Error('Geometria inválida: área e comprimento de referência devem ser positivos')
  }
  return records
    .filter((record) => record.force >= 0 && record.displacement >= 0)
    .map((record) => ({
      time: record.time,
      displacement: record.displacement,
      force: record.force,
      strain: record.displacement / geometry.gaugeLengthMm,
      stress: record.force / geometry.areaMm2,
    }))
}

function linearRegression(points: StressStrainPoint[]) {
  const n = points.length
  let sx = 0
  let sy = 0
  let sxx = 0
  let sxy = 0
  let syy = 0
  for (const { strain: x, stress: y } of points) {
    sx += x
    sy += y
    sxx += x * x
    sxy += x * y
    syy += y * y
  }
  const denominator = n * sxx - sx * sx
  if (denominator === 0) return null
  const slope = (n * sxy - sx * sy) / denominator
  const intercept = (sy - slope * sx) / n
  const ssTot = syy - (sy * sy) / n
  const ssRes = points.reduce((sum, p) => sum + (p.stress - (slope * p.strain + intercept)) ** 2, 0)
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 1
  return { slope, intercept, r2 }
}

/** Localiza o trecho linear de maior inclinação da curva ascendente (janelas deslizantes). */
export function findLinearRegion(
  ascending: StressStrainPoint[],
  options: ToeCompensationOptions = {}
): LinearRegion {
  const opts = { ...DEFAULT_TOE_OPTIONS, ...options }
  const maxStress = Math.max(...ascending.map((p) => p.stress))
  const candidates: number[] = []
  ascending.forEach((point, index) => {
    if (
      point.stress >= opts.lowerFraction * maxStress &&
      point.stress <= opts.upperFraction * maxStress
    ) {
      candidates.push(index)
    }
  })
  if (candidates.length < opts.minWindowPoints) {
    throw new Error('Pontos insuficientes para localizar o trecho linear')
  }
  const windowSize = Math.max(
    opts.minWindowPoints,
    Math.round(opts.windowFraction * candidates.length)
  )
  let best: LinearRegion | null = null
  for (let start = 0; start + windowSize <= candidates.length; start += 1) {
    const window = candidates.slice(start, start + windowSize).map((index) => ascending[index])
    const fit = linearRegression(window)
    if (!fit || !(fit.slope > 0)) continue
    if (!best || fit.slope > best.slope) {
      best = {
        slope: fit.slope,
        intercept: fit.intercept,
        startIndex: candidates[start],
        endIndex: candidates[start + windowSize - 1],
        r2: fit.r2,
      }
    }
  }
  if (!best) throw new Error('Não foi possível ajustar o trecho linear')
  return best
}

function trapezoid(points: StressStrainPoint[]): number {
  let area = 0
  for (let i = 1; i < points.length; i += 1) {
    area +=
      ((points[i].stress + points[i - 1].stress) / 2) * (points[i].strain - points[i - 1].strain)
  }
  return area
}

function offsetYield(
  corrected: CorrectedPoint[],
  modulus: number,
  fromIndex: number
): number | null {
  const gap = (p: StressStrainPoint) => p.stress - modulus * (p.strain - YIELD_OFFSET_STRAIN)
  for (let i = Math.max(1, fromIndex); i < corrected.length; i += 1) {
    const previous = corrected[i - 1]
    const current = corrected[i]
    if (gap(current) <= 0 && gap(previous) > 0) {
      const t = gap(previous) / (gap(previous) - gap(current))
      return previous.stress + t * (current.stress - previous.stress)
    }
  }
  return null
}

export function processTensileTest(
  records: MachineRecord[],
  geometry: SpecimenGeometry,
  options: ToeCompensationOptions = {}
): ProcessedTensileTest {
  const engineering = toEngineeringCurve(records, geometry)
  if (engineering.length < 10) throw new Error('Ensaio com poucos pontos válidos')

  let maxIndex = 0
  engineering.forEach((point, index) => {
    if (point.stress > engineering[maxIndex].stress) maxIndex = index
  })
  const maxStress = engineering[maxIndex].stress

  let ruptureIndex = maxIndex
  for (let i = maxIndex; i < engineering.length; i += 1) {
    if (engineering[i].stress >= RUPTURE_STRESS_FRACTION * maxStress) ruptureIndex = i
  }

  const linearRegion = findLinearRegion(engineering.slice(0, maxIndex + 1), options)
  const toeOffset = -linearRegion.intercept / linearRegion.slope

  // Início do trecho linear: a partir da janela, recua enquanto os pontos permanecem sobre a reta
  // (desvio de até 2% da tensão máxima). Só o que vem antes disso é tratado como acomodação.
  const tolerance = LINEAR_TOLERANCE_FRACTION * maxStress
  let linearStart = linearRegion.startIndex
  for (let i = linearRegion.startIndex - 1; i >= 0; i -= 1) {
    const point = engineering[i]
    const deviation = Math.abs(
      point.stress - (linearRegion.slope * point.strain + linearRegion.intercept)
    )
    if (deviation > tolerance) break
    linearStart = i
  }

  const origin: CorrectedPoint = {
    time: Number.NaN,
    displacement: toeOffset * geometry.gaugeLengthMm,
    force: 0,
    rawStrain: toeOffset,
    strain: 0,
    stress: 0,
  }
  const corrected: CorrectedPoint[] = [origin]
  for (let i = linearStart; i <= ruptureIndex; i += 1) {
    const point = engineering[i]
    const strain = point.strain - toeOffset
    if (strain < 0) continue
    corrected.push({ ...point, rawStrain: point.strain, strain })
  }

  const correctedMaxIndex = corrected.reduce(
    (best, point, index) => (point.stress > corrected[best].stress ? index : best),
    0
  )
  const ascending = corrected.slice(0, correctedMaxIndex + 1)
  const modulus = linearRegion.slope
  const yieldStress = offsetYield(corrected, modulus, 1)

  const properties: TensileProperties = {
    apparentModulus: modulus,
    maxStress,
    strainAtMaxStress: corrected[correctedMaxIndex].strain,
    ruptureStrain: corrected[corrected.length - 1].strain,
    offsetYieldStress: yieldStress,
    resilience: yieldStress === null ? null : (yieldStress * yieldStress) / (2 * modulus),
    toughness: trapezoid(corrected),
    maxForce: engineering[maxIndex].force,
  }

  return {
    geometry,
    engineering,
    corrected,
    ascending,
    linearRegion,
    linearStartIndex: linearStart,
    toeOffset,
    properties,
  }
}
