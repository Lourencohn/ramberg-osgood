/**
 * Validação externa do metamodelo com corpos de prova novos (campanha de validação).
 *
 * Treina o metamodelo com as 9 condições da série A (45 ensaios, exatamente como a plataforma faz)
 * e compara a predição com ensaios de validação feitos depois, nas condições A12, A20, A21 e A22.
 *
 * Uso: npx tsx scripts/analysis/validate-external.ts [--out analysis/validacao]
 */
import fs from 'node:fs'
import path from 'node:path'
import { processTensileTest, parseMachineFile } from '@/lib/tensile-processing'
import { fitRambergOsgoodCurve, seedFromString } from '@/lib/ramberg-osgood-fit'
import { buildTrainingPoint } from '@/lib/training-data'
import { buildExperimentalRun } from '@/lib/experimental-curve'
import { profileWeights } from '@/lib/metamodel'
import { predictProperties } from '@/lib/prediction'
import type { ExperimentalRun, RambergOsgoodTrainingPoint, StressStrainPoint } from '@/types'
import { mean, sampleStd } from './stats'

const ROOT = path.resolve(__dirname, '..', '..')
const DATA_DIR = path.join(ROOT, 'data')
const VAL_DIR = path.join(DATA_DIR, 'validacao')

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
const OUT_DIR = path.resolve(ROOT, argValue('--out') ?? 'analysis/validacao')

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim() !== '')
  const header = lines[0].split(',')
  return lines.slice(1).map((line) => {
    const values: string[] = []
    let field = ''
    let quoted = false
    for (const ch of line) {
      if (ch === '"') quoted = !quoted
      else if (ch === ',' && !quoted) {
        values.push(field)
        field = ''
      } else field += ch
    }
    values.push(field)
    return Object.fromEntries(header.map((key, i) => [key, values[i] ?? '']))
  })
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

// ---------------------------------------------------------------------------
// 1. Série A: treinamento, exatamente como em analyze-dataset.ts / prediction-data.ts
// ---------------------------------------------------------------------------
const seriesA = parseCsv(fs.readFileSync(path.join(DATA_DIR, 'specimens.csv'), 'utf8')).map(
  (row) => {
    const file = path.join(DATA_DIR, row.profile, `test_${row.test}`, 'raw.txt')
    const records = parseMachineFile(fs.readFileSync(file, 'latin1'))
    const processed = processTensileTest(records, {
      gaugeLengthMm: Number(row.gauge_length_mm),
      areaMm2: Number(row.area_mm2),
    })
    return {
      code: row.code,
      condition: row.code.split('-')[0],
      profile: row.profile,
      temperature: Number(row.temperature_c),
      speed: Number(row.speed_mm_s),
      area: Number(row.area_mm2),
      processed,
    }
  }
)

const conditionsA = [...new Set(seriesA.map((s) => s.condition))].sort()
const trainingData: RambergOsgoodTrainingPoint[] = conditionsA
  .map((condition) => {
    const group = seriesA.filter((s) => s.condition === condition)
    const point = buildTrainingPoint({
      profile: group[0].profile,
      temperature: group[0].temperature,
      speed: group[0].speed,
      tests: group.map((s) => s.processed.ascending),
    })
    if (!point) return null
    const runs = group
      .map((s) => buildExperimentalRun(s.code, s.processed.corrected))
      .filter((run): run is ExperimentalRun => run !== null)
    return { ...point, runs }
  })
  .filter((point): point is RambergOsgoodTrainingPoint => point !== null)

// ---------------------------------------------------------------------------
// 2. Corpos de prova de validação
// ---------------------------------------------------------------------------
const validationSpecimens = parseCsv(fs.readFileSync(path.join(VAL_DIR, 'specimens.csv'), 'utf8'))

const validation = validationSpecimens.map((row) => {
  const records = parseMachineFile(fs.readFileSync(path.join(VAL_DIR, row.file), 'latin1'))
  const area = Number(row.area_mm2)
  const processed = processTensileTest(records, {
    gaugeLengthMm: Number(row.gauge_length_mm),
    areaMm2: area,
  })
  const fit = fitRambergOsgoodCurve(processed.ascending, {
    seed: seedFromString(row.code),
    sampleSize: Math.min(400, processed.ascending.length),
  })
  const last = records[records.length - 1]
  const first = records[0]
  const crossheadRate = (60 * (last.displacement - first.displacement)) / (last.time - first.time)
  return {
    code: row.code,
    condition: row.condition,
    emicCp: Number(row.emic_cp),
    temperature: Number(row.temperature_c),
    speed: Number(row.speed_mm_s),
    area,
    emicMaxForce: Number(row.emic_max_force_n),
    emicRuptureStress: Number(row.rupture_stress_mpa),
    emicYield: Number(row.emic_yield_es1_mpa),
    emicModulus: Number(row.emic_modulus_es1_mpa),
    rawPoints: records.length,
    duration: last.time,
    crossheadRate,
    processed,
    fit,
  }
})

// ---------------------------------------------------------------------------
// 3. Utilidades de comparação de curvas
// ---------------------------------------------------------------------------
function stressAt(curve: StressStrainPoint[], strain: number): number {
  if (strain <= curve[0].strain) return curve[0].stress
  for (let i = 1; i < curve.length; i += 1) {
    if (curve[i].strain < strain) continue
    const a = curve[i - 1]
    const b = curve[i]
    const span = b.strain - a.strain
    const t = span > 0 ? (strain - a.strain) / span : 1
    return a.stress + t * (b.stress - a.stress)
  }
  return curve[curve.length - 1].stress
}

function curveRmse(predicted: StressStrainPoint[], measured: StressStrainPoint[], points = 201) {
  const maxStrain = Math.max(
    predicted[predicted.length - 1].strain,
    measured[measured.length - 1].strain
  )
  let sum = 0
  for (let i = 0; i <= points; i += 1) {
    const strain = (i / points) * maxStrain
    const diff = stressAt(predicted, strain) - stressAt(measured, strain)
    sum += diff * diff
  }
  return Math.sqrt(sum / (points + 1))
}

// ---------------------------------------------------------------------------
// 4. Predição por condição e comparação
// ---------------------------------------------------------------------------
const conditions = [...new Set(validation.map((v) => v.condition))].sort()

const specimenRows: Record<string, unknown>[] = []
const conditionRows: Record<string, unknown>[] = []
const curveFiles: Record<string, StressStrainPoint[]> = {}

async function main() {
for (const condition of conditions) {
  const group = validation.filter((v) => v.condition === condition)
  const input = { temperature: group[0].temperature, speed: group[0].speed }
  const prediction = await predictProperties(input, trainingData)
  const experimental = prediction.experimental
  const weights = profileWeights(input, trainingData)

  const refA = seriesA.filter((s) => s.condition === condition)
  const refStress = refA.map((s) => s.processed.properties.maxStress)
  const refForce = refA.map((s) => s.processed.properties.maxForce)
  const refArea = refA.map((s) => s.area)
  const refModulus = refA.map((s) => s.processed.properties.apparentModulus)
  const refRupture = refA.map((s) => s.processed.properties.ruptureStrain)
  const refToughness = refA.map((s) => s.processed.properties.toughness)

  const valStress = group.map((v) => v.processed.properties.maxStress)
  const valForce = group.map((v) => v.processed.properties.maxForce)
  const valArea = group.map((v) => v.area)
  const valModulus = group.map((v) => v.processed.properties.apparentModulus)
  const valRupture = group.map((v) => v.processed.properties.ruptureStrain)
  const valToughness = group.map((v) => v.processed.properties.toughness)
  // tensão que os novos corpos de prova teriam com a área média da série A na mesma condição
  const valStressRefArea = group.map((v) => v.processed.properties.maxForce / mean(refArea))

  curveFiles[`prevista_${condition}`] = prediction.curve
  if (experimental)
    curveFiles[`esperada_${condition}`] = experimental.curve.map((p) => ({
      strain: p.strain,
      stress: p.stress,
    }))

  for (const v of group) {
    const corrected = v.processed.corrected.map((p) => ({ strain: p.strain, stress: p.stress }))
    curveFiles[`validacao_${v.code}`] = corrected
    const ascending = v.processed.ascending.map((p) => ({ strain: p.strain, stress: p.stress }))
    specimenRows.push({
      codigo: v.code,
      condicao: v.condition,
      cp_relatorio_emic: v.emicCp,
      temperatura_c: v.temperature,
      velocidade_mm_s: v.speed,
      area_mm2: v.area,
      pontos_arquivo: v.rawPoints,
      duracao_s: v.duration,
      taxa_travessao_mm_min: v.crossheadRate,
      deslocamento_acomodacao: v.processed.toeOffset,
      forca_max_n: v.processed.properties.maxForce,
      forca_max_relatorio_n: v.emicMaxForce,
      tensao_max_mpa: v.processed.properties.maxStress,
      tensao_ruptura_relatorio_mpa: v.emicRuptureStress,
      tensao_max_area_serie_a_mpa: v.processed.properties.maxForce / mean(refArea),
      deformacao_tensao_max_pct: 100 * v.processed.properties.strainAtMaxStress,
      deformacao_ruptura_pct: 100 * v.processed.properties.ruptureStrain,
      modulo_aparente_mpa: v.processed.properties.apparentModulus,
      modulo_relatorio_es1_mpa: v.emicModulus,
      escoamento_offset_mpa: v.processed.properties.offsetYieldStress,
      tenacidade_mj_m3: v.processed.properties.toughness,
      ro_E_mpa: v.fit.params.E,
      ro_sigma0_mpa: v.fit.params.sigma_0,
      ro_n: v.fit.params.n,
      ro_r2: v.fit.r2,
      ro_rmse: v.fit.rmse,
      rmse_curva_prevista_ro_mpa: curveRmse(prediction.curve, ascending),
      rmse_curva_esperada_mpa: experimental
        ? curveRmse(
            experimental.curve.map((p) => ({ strain: p.strain, stress: p.stress })),
            ascending
          )
        : null,
      tensao_max_prevista_ro_mpa: prediction.properties.ultimateStress,
      tensao_max_esperada_mpa: experimental?.ultimateStress.mean ?? null,
      erro_ro_mpa: prediction.properties.ultimateStress - v.processed.properties.maxStress,
      erro_esperada_mpa: experimental
        ? experimental.ultimateStress.mean - v.processed.properties.maxStress
        : null,
    })
  }

  const predRo = prediction.properties.ultimateStress
  const predExp = experimental?.ultimateStress.mean ?? Number.NaN
  const predExpDev = experimental?.ultimateStress.deviation ?? Number.NaN
  const predModulus = experimental?.modulus?.mean ?? Number.NaN
  const predPeakStrain = experimental?.peakStrain.mean ?? Number.NaN

  conditionRows.push({
    condicao: condition,
    temperatura_c: input.temperature,
    velocidade_mm_s: input.speed,
    n_validacao: group.length,
    pesos_regressao: trainingData
      .map((p, i) => `${p.profile.replace('T', '').replace('_V', '/')}:${weights[i].toFixed(3)}`)
      .join(' '),
    // predição (treino = série A completa)
    tensao_max_prevista_ro_mpa: predRo,
    tensao_max_esperada_mpa: predExp,
    tensao_max_esperada_desvio_mpa: predExpDev,
    deformacao_tensao_max_prevista_pct: prediction.properties.ductility,
    deformacao_pico_esperada_pct: 100 * predPeakStrain,
    modulo_previsto_ro_mpa: prediction.properties.modulus,
    modulo_esperado_mpa: predModulus,
    tenacidade_prevista_mj_m3: prediction.properties.toughness,
    ro_E_previsto_mpa: prediction.rambergOsgood.E,
    ro_sigma0_previsto_mpa: prediction.rambergOsgood.sigma_0,
    ro_n_previsto: prediction.rambergOsgood.n,
    // série A (treinamento) na mesma condição
    serie_a_tensao_max_media_mpa: mean(refStress),
    serie_a_tensao_max_dp_mpa: sampleStd(refStress),
    serie_a_forca_max_media_n: mean(refForce),
    serie_a_area_media_mm2: mean(refArea),
    serie_a_modulo_medio_mpa: mean(refModulus),
    serie_a_deformacao_ruptura_media_pct: 100 * mean(refRupture),
    serie_a_tenacidade_media_mj_m3: mean(refToughness),
    // validação
    validacao_tensao_max_media_mpa: mean(valStress),
    validacao_tensao_max_dp_mpa: sampleStd(valStress),
    validacao_tensao_ruptura_relatorio_media_mpa: mean(group.map((v) => v.emicRuptureStress)),
    validacao_forca_max_media_n: mean(valForce),
    validacao_area_media_mm2: mean(valArea),
    validacao_tensao_max_area_serie_a_media_mpa: mean(valStressRefArea),
    validacao_modulo_medio_mpa: mean(valModulus),
    validacao_modulo_relatorio_medio_mpa: mean(group.map((v) => v.emicModulus)),
    validacao_deformacao_ruptura_media_pct: 100 * mean(valRupture),
    validacao_tenacidade_media_mj_m3: mean(valToughness),
    // erros
    erro_ro_mpa: predRo - mean(valStress),
    erro_ro_pct: (100 * (predRo - mean(valStress))) / mean(valStress),
    erro_esperada_mpa: predExp - mean(valStress),
    erro_esperada_pct: (100 * (predExp - mean(valStress))) / mean(valStress),
    erro_ro_area_serie_a_mpa: predRo - mean(valStressRefArea),
    erro_ro_area_serie_a_pct: (100 * (predRo - mean(valStressRefArea))) / mean(valStressRefArea),
    diferenca_forca_pct: (100 * (mean(valForce) - mean(refForce))) / mean(refForce),
    diferenca_area_pct: (100 * (mean(valArea) - mean(refArea))) / mean(refArea),
    erro_modulo_esperado_mpa: predModulus - mean(valModulus),
    erro_modulo_esperado_pct: (100 * (predModulus - mean(valModulus))) / mean(valModulus),
    z_esperada: (mean(valStress) - predExp) / predExpDev,
    rmse_curva_prevista_ro_media_mpa: mean(
      group.map((v) =>
        curveRmse(
          prediction.curve,
          v.processed.ascending.map((p) => ({ strain: p.strain, stress: p.stress }))
        )
      )
    ),
  })
}

fs.mkdirSync(OUT_DIR, { recursive: true })
writeCsv(path.join(OUT_DIR, 'corpos_de_prova_validacao.csv'), specimenRows)
writeCsv(path.join(OUT_DIR, 'condicoes_validacao.csv'), conditionRows)
for (const [name, curve] of Object.entries(curveFiles)) {
  writeCsv(
    path.join(OUT_DIR, 'curvas', `${name}.csv`),
    curve.map((p) => ({ deformacao: p.strain, tensao_mpa: p.stress }))
  )
}

const allStressErrorsRo = conditionRows.map((r) => Number(r.erro_ro_mpa))
const allStressErrorsExp = conditionRows.map((r) => Number(r.erro_esperada_mpa))
const allStressErrorsRoArea = conditionRows.map((r) => Number(r.erro_ro_area_serie_a_mpa))
const specimenErrorsRo = specimenRows.map((r) => Number(r.erro_ro_mpa))
const mae = (values: number[]) => mean(values.map(Math.abs))
const rmse = (values: number[]) => Math.sqrt(mean(values.map((v) => v * v)))

const summary = {
  gerado_em: new Date().toISOString(),
  treinamento: { condicoes: trainingData.length, corpos_de_prova: seriesA.length },
  validacao: { condicoes: conditions.length, corpos_de_prova: validation.length },
  tensao_max_por_condicao: {
    mae_ro_mpa: mae(allStressErrorsRo),
    rmse_ro_mpa: rmse(allStressErrorsRo),
    mae_ro_pct: mean(conditionRows.map((r) => Math.abs(Number(r.erro_ro_pct)))),
    mae_esperada_mpa: mae(allStressErrorsExp),
    mae_esperada_pct: mean(conditionRows.map((r) => Math.abs(Number(r.erro_esperada_pct)))),
    mae_ro_com_area_serie_a_mpa: mae(allStressErrorsRoArea),
    vies_ro_mpa: mean(allStressErrorsRo),
  },
  tensao_max_por_corpo_de_prova: {
    mae_ro_mpa: mae(specimenErrorsRo),
    rmse_ro_mpa: rmse(specimenErrorsRo),
  },
  rmse_curva_prevista_ro_medio_mpa: mean(
    specimenRows.map((r) => Number(r.rmse_curva_prevista_ro_mpa))
  ),
  modulo: {
    mae_esperado_mpa: mae(conditionRows.map((r) => Number(r.erro_modulo_esperado_mpa))),
    mae_esperado_pct: mean(conditionRows.map((r) => Math.abs(Number(r.erro_modulo_esperado_pct)))),
  },
  taxa_travessao_mm_min: {
    min: Math.min(...validation.map((v) => v.crossheadRate)),
    max: Math.max(...validation.map((v) => v.crossheadRate)),
  },
  ro_r2_validacao: {
    min: Math.min(...validation.map((v) => v.fit.r2)),
    max: Math.max(...validation.map((v) => v.fit.r2)),
  },
}
fs.writeFileSync(path.join(OUT_DIR, 'resumo.json'), JSON.stringify(summary, null, 2) + '\n')

console.log(JSON.stringify(summary, null, 2))
console.table(
  conditionRows.map((r) => ({
    cond: r.condicao,
    prev_RO: Number(r.tensao_max_prevista_ro_mpa).toFixed(2),
    esperada: `${Number(r.tensao_max_esperada_mpa).toFixed(2)} ± ${Number(r.tensao_max_esperada_desvio_mpa).toFixed(2)}`,
    serieA: `${Number(r.serie_a_tensao_max_media_mpa).toFixed(2)} ± ${Number(r.serie_a_tensao_max_dp_mpa).toFixed(2)}`,
    valid: `${Number(r.validacao_tensao_max_media_mpa).toFixed(2)} ± ${Number(r.validacao_tensao_max_dp_mpa).toFixed(2)}`,
    valid_areaA: Number(r.validacao_tensao_max_area_serie_a_media_mpa).toFixed(2),
    dForca: Number(r.diferenca_forca_pct).toFixed(1),
    dArea: Number(r.diferenca_area_pct).toFixed(1),
    erroRO: Number(r.erro_ro_mpa).toFixed(2),
    erroExp: Number(r.erro_esperada_mpa).toFixed(2),
    z: Number(r.z_esperada).toFixed(2),
  }))
)
console.table(
  specimenRows.map((r) => ({
    cp: r.codigo,
    area: Number(r.area_mm2).toFixed(2),
    taxa: Number(r.taxa_travessao_mm_min).toFixed(2),
    toe: Number(r.deslocamento_acomodacao).toFixed(4),
    Fmax: Number(r.forca_max_n).toFixed(1),
    smax: Number(r.tensao_max_mpa).toFixed(2),
    emic_rup: Number(r.tensao_ruptura_relatorio_mpa).toFixed(2),
    E: Number(r.modulo_aparente_mpa).toFixed(0),
    E_emic: Number(r.modulo_relatorio_es1_mpa).toFixed(0),
    eps_rup: Number(r.deformacao_ruptura_pct).toFixed(2),
    tough: Number(r.tenacidade_mj_m3).toFixed(2),
    r2: Number(r.ro_r2).toFixed(4),
    rmseCurva: Number(r.rmse_curva_prevista_ro_mpa).toFixed(2),
  }))
)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
