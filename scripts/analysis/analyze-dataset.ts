import fs from 'node:fs'
import path from 'node:path'
import {
  processTensileTest,
  parseMachineFile,
  type ProcessedTensileTest,
} from '@/lib/tensile-processing'
import { fitRambergOsgoodCurve, seedFromString } from '@/lib/ramberg-osgood-fit'
import { buildTrainingPoint, downsample } from '@/lib/training-data'
import { predictParameters, predictScalar } from '@/lib/metamodel'
import { predictProperties } from '@/lib/prediction'
import { calculateStress } from '@/lib/ramberg-osgood'
import type { RambergOsgoodTrainingPoint, StressStrainPoint } from '@/types'
import { mean, sampleStd, twoWayAnova } from './stats'
import { compareMetamodels } from './metamodel-comparison'

const ROOT = path.resolve(__dirname, '..', '..')
const DATA_DIR = path.join(ROOT, 'data')

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const EXCLUDE = new Set((argValue('--exclude') ?? '').split(',').filter(Boolean))
const OUT_DIR = path.resolve(ROOT, argValue('--out') ?? 'analysis/results')

function parseCsv(content: string): Record<string, string>[] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let quoted = false
  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i]
    if (quoted) {
      if (ch === '"' && content[i + 1] === '"') {
        field += '"'
        i += 1
      } else if (ch === '"') quoted = false
      else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && content[i + 1] === '\n') i += 1
      row.push(field)
      field = ''
      if (row.some((value) => value !== '')) rows.push(row)
      row = []
    } else field += ch
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  const [header, ...body] = rows
  return body.map((values) => Object.fromEntries(header.map((key, j) => [key, values[j] ?? ''])))
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number')
    return Number.isFinite(value) ? String(Number(value.toPrecision(8))) : ''
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function writeCsv(file: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  const header = Object.keys(rows[0])
  const lines = [
    header.join(','),
    ...rows.map((row) => header.map((key) => formatValue(row[key])).join(',')),
  ]
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, lines.join('\n') + '\n')
}

interface Specimen {
  code: string
  condition: string
  profile: string
  test: number
  temperature: number
  speed: number
  gaugeLength: number
  width: number | null
  thickness: number | null
  area: number
  areaSource: string
  crossheadSpeed: number
  notes: string
}

const TEMPERATURES = [190, 210, 220]
const SPEEDS = [90, 95, 100]

const specimens: Specimen[] = parseCsv(
  fs.readFileSync(path.join(DATA_DIR, 'specimens.csv'), 'utf8')
)
  .map((row) => ({
    code: row.code,
    condition: row.code.split('-')[0],
    profile: row.profile,
    test: Number(row.test),
    temperature: Number(row.temperature_c),
    speed: Number(row.speed_mm_s),
    gaugeLength: Number(row.gauge_length_mm),
    width: row.width_mm ? Number(row.width_mm) : null,
    thickness: row.thickness_mm ? Number(row.thickness_mm) : null,
    area: Number(row.area_mm2),
    areaSource: row.area_source,
    crossheadSpeed: Number(row.crosshead_speed_mm_min),
    notes: row.notes,
  }))
  .filter((specimen) => !EXCLUDE.has(specimen.code))

const emicRows = parseCsv(fs.readFileSync(path.join(DATA_DIR, 'emic', 'relatorios.csv'), 'utf8'))

interface TestResult {
  specimen: Specimen
  processed: ProcessedTensileTest
  fit: ReturnType<typeof fitRambergOsgoodCurve>
  rawPoints: number
}

const results: TestResult[] = specimens.map((specimen) => {
  const file = path.join(DATA_DIR, specimen.profile, `test_${specimen.test}`, 'raw.txt')
  const records = parseMachineFile(fs.readFileSync(file, 'latin1'))
  const processed = processTensileTest(records, {
    gaugeLengthMm: specimen.gaugeLength,
    areaMm2: specimen.area,
  })
  const fit = fitRambergOsgoodCurve(processed.ascending, {
    seed: seedFromString(specimen.code),
    sampleSize: Math.min(400, processed.ascending.length),
  })
  return { specimen, processed, fit, rawPoints: records.length }
})

const testRows = results.map(({ specimen, processed, fit, rawPoints }) => ({
  codigo: specimen.code,
  condicao: specimen.condition,
  temperatura_c: specimen.temperature,
  velocidade_mm_s: specimen.speed,
  velocidade_ensaio_mm_min: specimen.crossheadSpeed,
  largura_mm: specimen.width,
  espessura_mm: specimen.thickness,
  area_mm2: specimen.area,
  origem_area: specimen.areaSource,
  pontos_arquivo: rawPoints,
  pontos_curva_corrigida: processed.corrected.length,
  deslocamento_acomodacao: processed.toeOffset,
  forca_max_n: processed.properties.maxForce,
  tensao_max_mpa: processed.properties.maxStress,
  deformacao_tensao_max: processed.properties.strainAtMaxStress,
  deformacao_ruptura: processed.properties.ruptureStrain,
  modulo_aparente_mpa: processed.properties.apparentModulus,
  r2_trecho_linear: processed.linearRegion.r2,
  escoamento_offset_mpa: processed.properties.offsetYieldStress,
  resiliencia_mj_m3: processed.properties.resilience,
  tenacidade_mj_m3: processed.properties.toughness,
  ro_E_mpa: fit.params.E,
  ro_sigma0_mpa: fit.params.sigma_0,
  ro_n: fit.params.n,
  ro_r2: fit.r2,
  ro_rmse: fit.rmse,
  ro_pontos: fit.pointsUsed,
  observacao: specimen.notes,
}))
writeCsv(path.join(OUT_DIR, 'corpos_de_prova.csv'), testRows)

const conditions = [...new Set(results.map((result) => result.specimen.condition))].sort()
const byCondition = (condition: string) =>
  results.filter((result) => result.specimen.condition === condition)

function describe(values: number[]) {
  const m = mean(values)
  const s = sampleStd(values)
  return { mean: m, sd: s, cv: m ? (100 * s) / m : 0 }
}

const conditionRows = conditions.map((condition) => {
  const group = byCondition(condition)
  const pick = (getter: (result: TestResult) => number | null) =>
    group.map(getter).filter((value): value is number => value !== null && Number.isFinite(value))
  const widths = pick((r) => r.specimen.width)
  const thicknesses = pick((r) => r.specimen.thickness)
  const area = describe(pick((r) => r.specimen.area))
  const stress = describe(pick((r) => r.processed.properties.maxStress))
  const modulus = describe(pick((r) => r.processed.properties.apparentModulus))
  const rupture = describe(pick((r) => r.processed.properties.ruptureStrain))
  const toughness = describe(pick((r) => r.processed.properties.toughness))
  const yieldStress = describe(pick((r) => r.processed.properties.offsetYieldStress))
  return {
    condicao: condition,
    temperatura_c: group[0].specimen.temperature,
    velocidade_mm_s: group[0].specimen.speed,
    n: group.length,
    largura_media_mm: widths.length ? mean(widths) : null,
    espessura_media_mm: thicknesses.length ? mean(thicknesses) : null,
    n_dimensoes: widths.length,
    area_media_mm2: area.mean,
    area_dp_mm2: area.sd,
    tensao_max_media_mpa: stress.mean,
    tensao_max_dp_mpa: stress.sd,
    tensao_max_cv_pct: stress.cv,
    modulo_medio_mpa: modulus.mean,
    modulo_dp_mpa: modulus.sd,
    deformacao_ruptura_media_pct: 100 * rupture.mean,
    deformacao_ruptura_dp_pct: 100 * rupture.sd,
    tenacidade_media_mj_m3: toughness.mean,
    tenacidade_dp_mj_m3: toughness.sd,
    escoamento_medio_mpa: yieldStress.mean,
    ro_E_medio_mpa: mean(pick((r) => r.fit.params.E)),
    ro_sigma0_medio_mpa: mean(pick((r) => r.fit.params.sigma_0)),
    ro_n_medio: mean(pick((r) => r.fit.params.n)),
    ro_r2_medio: mean(pick((r) => r.fit.r2)),
    ro_rmse_medio: mean(pick((r) => r.fit.rmse)),
  }
})
writeCsv(path.join(OUT_DIR, 'condicoes.csv'), conditionRows)

const trainingData: RambergOsgoodTrainingPoint[] = conditions
  .map((condition) => {
    const group = byCondition(condition)
    return buildTrainingPoint({
      profile: group[0].specimen.profile,
      temperature: group[0].specimen.temperature,
      speed: group[0].specimen.speed,
      tests: group.map((result) => result.processed.ascending),
    })
  })
  .filter((point): point is RambergOsgoodTrainingPoint => point !== null)

writeCsv(
  path.join(OUT_DIR, 'treinamento.csv'),
  trainingData.map((point) => ({
    perfil: point.profile,
    temperatura_c: point.temperature,
    velocidade_mm_s: point.speed,
    E_mpa: point.E,
    sigma0_mpa: point.sigma_0,
    n: point.n,
    deformacao_max: point.maxStrain,
    rmse: point.rmse,
    pontos: point.pointsUsed,
  }))
)

const emicComparison = conditions.map((condition) => {
  const reports = emicRows.filter((row) => row.condition === condition && !EXCLUDE.has(row.code))
  const group = byCondition(condition)
  const platformStress = mean(group.map((r) => r.processed.properties.maxStress))
  const platformModulus = mean(group.map((r) => r.processed.properties.apparentModulus))
  if (!reports.length) {
    return {
      condicao: condition,
      n_relatorio: 0,
      tensao_max_plataforma_mpa: platformStress,
      modulo_plataforma_mpa: platformModulus,
    }
  }
  const ruptureStress = reports.map((row) => Number(row.rupture_stress_mpa))
  const maxStressEmic = reports.map((row) => {
    const specimen = specimens.find((s) => s.code === row.code)
    return specimen ? Number(row.max_force_n) / specimen.area : Number.NaN
  })
  const modulus = reports.map((row) => Number(row.elastic_modulus_mpa))
  const yieldEs1 = reports.map((row) => Number(row.yield_stress_es1_mpa))
  const stressReport = describe(ruptureStress)
  return {
    condicao: condition,
    n_relatorio: reports.length,
    tensao_ruptura_relatorio_mpa: stressReport.mean,
    tensao_ruptura_relatorio_cv_pct: stressReport.cv,
    tensao_max_relatorio_mpa: mean(maxStressEmic),
    escoamento_es1_relatorio_mpa: mean(yieldEs1),
    modulo_relatorio_mpa: mean(modulus),
    tensao_max_plataforma_mpa: platformStress,
    modulo_plataforma_mpa: platformModulus,
    diferenca_tensao_max_pct: (100 * (platformStress - mean(maxStressEmic))) / mean(maxStressEmic),
    diferenca_tensao_ruptura_pct: (100 * (platformStress - stressReport.mean)) / stressReport.mean,
    diferenca_modulo_pct: (100 * (platformModulus - mean(modulus))) / mean(modulus),
  }
})
writeCsv(path.join(OUT_DIR, 'comparacao_emic.csv'), emicComparison)

const levelT = (r: TestResult) => TEMPERATURES.indexOf(r.specimen.temperature)
const levelV = (r: TestResult) => SPEEDS.indexOf(r.specimen.speed)
const anovaTargets: [string, (r: TestResult) => number][] = [
  ['tensao_max', (r) => r.processed.properties.maxStress],
  ['modulo_aparente', (r) => r.processed.properties.apparentModulus],
  ['deformacao_ruptura', (r) => r.processed.properties.ruptureStrain],
  ['tenacidade', (r) => r.processed.properties.toughness],
]
const anovaRows = anovaTargets.flatMap(([name, getter]) =>
  twoWayAnova(results.map(getter), results.map(levelT), results.map(levelV), 3, 3).map((row) => ({
    propriedade: name,
    fonte: row.source,
    soma_quadrados: row.ss,
    gl: row.df,
    quadrado_medio: row.ms,
    F: row.f,
    F_critico_5pct: row.fCritical,
    p: row.p,
  }))
)
writeCsv(path.join(OUT_DIR, 'anova.csv'), anovaRows)

const marginal = (
  getter: (r: TestResult) => number,
  key: 'temperature' | 'speed',
  levels: number[]
) => levels.map((level) => mean(results.filter((r) => r.specimen[key] === level).map(getter)))
writeCsv(path.join(OUT_DIR, 'medias_marginais.csv'), [
  ...TEMPERATURES.map((t, i) => ({
    fator: 'temperatura',
    nivel: t,
    tensao_max_mpa: marginal((r) => r.processed.properties.maxStress, 'temperature', TEMPERATURES)[
      i
    ],
    modulo_mpa: marginal(
      (r) => r.processed.properties.apparentModulus,
      'temperature',
      TEMPERATURES
    )[i],
    deformacao_ruptura_pct:
      100 * marginal((r) => r.processed.properties.ruptureStrain, 'temperature', TEMPERATURES)[i],
    tenacidade_mj_m3: marginal(
      (r) => r.processed.properties.toughness,
      'temperature',
      TEMPERATURES
    )[i],
  })),
  ...SPEEDS.map((v, i) => ({
    fator: 'velocidade',
    nivel: v,
    tensao_max_mpa: marginal((r) => r.processed.properties.maxStress, 'speed', SPEEDS)[i],
    modulo_mpa: marginal((r) => r.processed.properties.apparentModulus, 'speed', SPEEDS)[i],
    deformacao_ruptura_pct:
      100 * marginal((r) => r.processed.properties.ruptureStrain, 'speed', SPEEDS)[i],
    tenacidade_mj_m3: marginal((r) => r.processed.properties.toughness, 'speed', SPEEDS)[i],
  })),
])

function curveStressRmse(
  params: RambergOsgoodTrainingPoint,
  curves: StressStrainPoint[][]
): number {
  let sum = 0
  let count = 0
  for (const curve of curves) {
    for (const point of downsample(
      curve.filter((p) => p.strain > 0),
      200
    )) {
      const predicted = calculateStress(point.strain, params)
      sum += (predicted - point.stress) ** 2
      count += 1
    }
  }
  return Math.sqrt(sum / count)
}

async function crossValidation() {
  const rows: Record<string, unknown>[] = []
  const curves: Record<string, unknown>[] = []
  for (const left of trainingData) {
    const condition = conditions.find((c) => byCondition(c)[0].specimen.profile === left.profile)!
    const group = byCondition(condition)
    const train = trainingData.filter((point) => point.profile !== left.profile)
    const input = { temperature: left.temperature, speed: left.speed }
    const prediction = await predictProperties(input, train)
    const means = (getter: (r: TestResult) => number) =>
      train.map((point) => {
        const c = conditions.find(
          (cond) => byCondition(cond)[0].specimen.profile === point.profile
        )!
        return mean(byCondition(c).map(getter))
      })
    const directStress = predictScalar(
      input,
      train,
      means((r) => r.processed.properties.maxStress)
    )
    const directModulus = predictScalar(
      input,
      train,
      means((r) => r.processed.properties.apparentModulus)
    )
    const paramInterpolation = predictParameters(input, train)
    const paramStress = calculateStress(paramInterpolation.maxStrain, paramInterpolation)
    const predictedPoint = { ...left, ...prediction.rambergOsgood, maxStrain: left.maxStrain }
    rows.push({
      condicao: condition,
      temperatura_c: left.temperature,
      velocidade_mm_s: left.speed,
      tensao_max_real_mpa: mean(group.map((r) => r.processed.properties.maxStress)),
      tensao_max_prevista_curva_mpa: prediction.properties.ultimateStress,
      tensao_max_prevista_direta_mpa: directStress,
      tensao_max_prevista_parametros_mpa: paramStress,
      modulo_real_mpa: mean(group.map((r) => r.processed.properties.apparentModulus)),
      modulo_previsto_direto_mpa: directModulus,
      E_ajustado_mpa: left.E,
      E_previsto_mpa: prediction.rambergOsgood.E,
      sigma0_ajustado_mpa: left.sigma_0,
      sigma0_previsto_mpa: prediction.rambergOsgood.sigma_0,
      n_ajustado: left.n,
      n_previsto: prediction.rambergOsgood.n,
      deformacao_max_real: left.maxStrain,
      deformacao_max_prevista: prediction.curve[prediction.curve.length - 1]?.strain ?? null,
      rmse_curva_prevista_mpa: curveStressRmse(
        predictedPoint,
        group.map((r) => r.processed.ascending)
      ),
      rmse_curva_ajustada_mpa: curveStressRmse(
        left,
        group.map((r) => r.processed.ascending)
      ),
    })
    for (const point of prediction.curve) {
      curves.push({ condicao: condition, deformacao: point.strain, tensao_mpa: point.stress })
    }
  }
  writeCsv(path.join(OUT_DIR, 'validacao_cruzada.csv'), rows)
  writeCsv(path.join(OUT_DIR, 'curvas', 'validacao_cruzada_curvas.csv'), curves)

  const error = (key: string) => {
    const diffs = rows.map((row) => Number(row[key]) - Number(row.tensao_max_real_mpa))
    const mae = mean(diffs.map(Math.abs))
    const rmse = Math.sqrt(mean(diffs.map((d) => d * d)))
    return {
      mae,
      rmse,
      maePct: (100 * mae) / mean(rows.map((row) => Number(row.tensao_max_real_mpa))),
    }
  }
  const relative = (real: string, predicted: string) =>
    100 *
    mean(
      rows.map(
        (row) => Math.abs(Number(row[predicted]) - Number(row[real])) / Math.abs(Number(row[real]))
      )
    )
  const naive = rows.map((row, i) => {
    const others = rows.filter((_, j) => j !== i).map((r) => Number(r.tensao_max_real_mpa))
    return Math.abs(mean(others) - Number(row.tensao_max_real_mpa))
  })
  const modulusErrors = rows.map((row) =>
    Math.abs(Number(row.modulo_previsto_direto_mpa) - Number(row.modulo_real_mpa))
  )
  return {
    tensao_max_curva: error('tensao_max_prevista_curva_mpa'),
    tensao_max_direta: error('tensao_max_prevista_direta_mpa'),
    tensao_max_parametros: error('tensao_max_prevista_parametros_mpa'),
    tensao_max_media_das_outras_mae: mean(naive),
    modulo_direto_mae: mean(modulusErrors),
    modulo_direto_mae_pct:
      (100 * mean(modulusErrors)) / mean(rows.map((row) => Number(row.modulo_real_mpa))),
    parametros_erro_relativo_pct: {
      E: relative('E_ajustado_mpa', 'E_previsto_mpa'),
      sigma0: relative('sigma0_ajustado_mpa', 'sigma0_previsto_mpa'),
      n: relative('n_ajustado', 'n_previsto'),
    },
    rmse_curva_prevista_medio_mpa: mean(rows.map((row) => Number(row.rmse_curva_prevista_mpa))),
    rmse_curva_ajustada_medio_mpa: mean(rows.map((row) => Number(row.rmse_curva_ajustada_mpa))),
  }
}

async function responseSurface() {
  const rows: Record<string, unknown>[] = []
  const stressMeans = conditions.map((c) =>
    mean(byCondition(c).map((r) => r.processed.properties.maxStress))
  )
  const coordinates = conditions.map((c) => ({
    temperature: byCondition(c)[0].specimen.temperature,
    speed: byCondition(c)[0].specimen.speed,
  }))
  for (let t = 190; t <= 220; t += 1) {
    for (let v = 90; v <= 100.0001; v += 0.5) {
      const input = { temperature: t, speed: Math.round(v * 10) / 10 }
      const prediction = await predictProperties(input, trainingData)
      rows.push({
        temperatura_c: input.temperature,
        velocidade_mm_s: input.speed,
        tensao_max_curva_mpa: prediction.properties.ultimateStress,
        tensao_max_direta_mpa: predictScalar(input, coordinates, stressMeans),
        E_mpa: prediction.rambergOsgood.E,
        sigma0_mpa: prediction.rambergOsgood.sigma_0,
        n: prediction.rambergOsgood.n,
      })
    }
  }
  writeCsv(path.join(OUT_DIR, 'superficie_resposta.csv'), rows)

  const example = await predictProperties({ temperature: 205, speed: 97 }, trainingData)
  writeCsv(
    path.join(OUT_DIR, 'curvas', 'exemplo_205C_97mms.csv'),
    example.curve.map((point) => ({ deformacao: point.strain, tensao_mpa: point.stress }))
  )
  return {
    entrada: { temperatura_c: 205, velocidade_mm_s: 97 },
    E_mpa: example.rambergOsgood.E,
    sigma0_mpa: example.rambergOsgood.sigma_0,
    n: example.rambergOsgood.n,
    deformacao_max: example.curve[example.curve.length - 1].strain,
    tensao_na_deformacao_max_mpa: example.properties.ultimateStress,
    tensao_max_direta_mpa: predictScalar({ temperature: 205, speed: 97 }, coordinates, stressMeans),
  }
}

function exportCurves() {
  const corrected: Record<string, unknown>[] = []
  const raw: Record<string, unknown>[] = []
  const fitted: Record<string, unknown>[] = []
  for (const { specimen, processed, fit } of results) {
    for (const point of downsample(processed.corrected, 400)) {
      corrected.push({
        codigo: specimen.code,
        condicao: specimen.condition,
        deformacao: point.strain,
        tensao_mpa: point.stress,
      })
    }
    for (const point of downsample(processed.engineering, 400)) {
      raw.push({
        codigo: specimen.code,
        condicao: specimen.condition,
        deformacao: point.strain,
        tensao_mpa: point.stress,
      })
    }
    for (const point of fit.curve) {
      fitted.push({
        codigo: specimen.code,
        condicao: specimen.condition,
        deformacao: point.strain,
        tensao_mpa: point.stress,
      })
    }
  }
  writeCsv(path.join(OUT_DIR, 'curvas', 'corrigidas.csv'), corrected)
  writeCsv(path.join(OUT_DIR, 'curvas', 'brutas.csv'), raw)
  writeCsv(path.join(OUT_DIR, 'curvas', 'ajustes_por_ensaio.csv'), fitted)
  const trainingCurves: Record<string, unknown>[] = []
  for (const point of trainingData) {
    const condition = conditions.find((c) => byCondition(c)[0].specimen.profile === point.profile)!
    for (let i = 0; i <= 150; i += 1) {
      const strain = (i / 150) * point.maxStrain
      trainingCurves.push({
        condicao: condition,
        deformacao: strain,
        tensao_mpa: calculateStress(strain, point),
      })
    }
  }
  writeCsv(path.join(OUT_DIR, 'curvas', 'ajustes_por_condicao.csv'), trainingCurves)
}

function metamodelComparison() {
  const comparison = compareMetamodels(
    results.map(({ specimen, processed }) => ({
      code: specimen.code,
      profile: specimen.profile,
      temperature: specimen.temperature,
      speed: specimen.speed,
      ascending: processed.ascending,
      maxStress: processed.properties.maxStress,
      apparentModulus: processed.properties.apparentModulus,
      toughness: processed.properties.toughness,
    })),
    trainingData
  )
  writeCsv(path.join(OUT_DIR, 'metamodelos_resumo.csv'), comparison.summaryRows)
  writeCsv(path.join(OUT_DIR, 'metamodelos_por_condicao.csv'), comparison.foldRows)
  writeCsv(path.join(OUT_DIR, 'metamodelos_selecao_aninhada.csv'), comparison.nestedRows)
  writeCsv(path.join(OUT_DIR, 'metamodelos_ensaiadas.csv'), comparison.testedConditionRows)
  writeCsv(path.join(OUT_DIR, 'falta_de_ajuste.csv'), comparison.lackOfFitRows)
  writeCsv(path.join(OUT_DIR, 'homogeneidade_variancias.csv'), comparison.varianceRows)
  return comparison.summary
}

async function main() {
  exportCurves()
  const cv = await crossValidation()
  const metamodels = metamodelComparison()
  const example = await responseSurface()
  const all = results.map((r) => r.processed.properties)
  const summary = {
    gerado_em: new Date().toISOString(),
    excluidos: [...EXCLUDE],
    corpos_de_prova: results.length,
    pontos_arquivos_brutos: {
      min: Math.min(...results.map((r) => r.rawPoints)),
      max: Math.max(...results.map((r) => r.rawPoints)),
    },
    forca_max_n: {
      min: Math.min(...all.map((p) => p.maxForce)),
      max: Math.max(...all.map((p) => p.maxForce)),
    },
    tensao_max_condicao_mpa: {
      min: Math.min(...conditionRows.map((r) => r.tensao_max_media_mpa)),
      max: Math.max(...conditionRows.map((r) => r.tensao_max_media_mpa)),
    },
    deformacao_ruptura_condicao_pct: {
      min: Math.min(...conditionRows.map((r) => r.deformacao_ruptura_media_pct)),
      max: Math.max(...conditionRows.map((r) => r.deformacao_ruptura_media_pct)),
    },
    deslocamento_acomodacao: {
      min: Math.min(...results.map((r) => r.processed.toeOffset)),
      max: Math.max(...results.map((r) => r.processed.toeOffset)),
    },
    ro_r2_ensaio: {
      min: Math.min(...results.map((r) => r.fit.r2)),
      max: Math.max(...results.map((r) => r.fit.r2)),
    },
    ro_r2_condicao: {
      min: Math.min(...conditionRows.map((r) => r.ro_r2_medio)),
      max: Math.max(...conditionRows.map((r) => r.ro_r2_medio)),
    },
    validacao_cruzada: cv,
    metamodelos: metamodels,
    exemplo: example,
  }
  fs.writeFileSync(path.join(OUT_DIR, 'resumo.json'), JSON.stringify(summary, null, 2) + '\n')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
