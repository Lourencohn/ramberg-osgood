import { profileWeights } from '@/lib/metamodel'
import { calculateStress } from '@/lib/ramberg-osgood'
import { buildTrainingPoint, downsample } from '@/lib/training-data'
import { calculatePropertiesFromCurve } from '@/lib/mechanical-properties'
import type { RambergOsgoodTrainingPoint, StressStrainPoint } from '@/types'
import { chiSquareSurvival, fSurvival, mean } from './stats'

export interface ComparisonSpecimen {
  code: string
  profile: string
  temperature: number
  speed: number
  ascending: StressStrainPoint[]
  maxStress: number
  apparentModulus: number
  toughness: number
}

type Coord = [number, number]
type Smoother = (train: Coord[], query: Coord) => number[] | null
type Candidate = { name: string; adopted?: boolean; current?: boolean; smoother: () => Smoother }
type CurveVector = { strain: number; stress: number[] }
type Prediction = CurveVector & { hyper: number | null }
type FoldResult = {
  scheme: string
  model: string
  condition: string
  curveRmse: number
  stressError: number
  strainError: number
  hyper: number | null
  leverage: number
}

const NORMALIZED_POINTS = 101
const COMPARISON_POINTS = 201
const EPSILON_GRID = [0.25, 0.35, 0.5, 0.7, 1, 1.4, 2, 2.8, 4, 5.6, 8]
const LAMBDA_GRID = [0, 1e-4, 1e-3, 3e-3, 1e-2, 3e-2, 0.1, 0.3, 1, 3, 10, 100, 1e4]
const U = Array.from({ length: NORMALIZED_POINTS }, (_, k) => k / (NORMALIZED_POINTS - 1))

function solve(matrix: number[][], rhs: number[]): number[] | null {
  const size = rhs.length
  const augmented = matrix.map((row, i) => [...row, rhs[i]])
  for (let column = 0; column < size; column += 1) {
    let pivot = column
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row
    }
    if (Math.abs(augmented[pivot][column]) < 1e-10) return null
    ;[augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]]
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue
      const factor = augmented[row][column] / augmented[column][column]
      for (let k = column; k <= size; k += 1) augmented[row][k] -= factor * augmented[column][k]
    }
  }
  return augmented.map((row, i) => row[size] / row[i])
}

const distance = (a: Coord, b: Coord) => Math.hypot(a[0] - b[0], a[1] - b[1])
const gaussian = (epsilon: number) => (r: number) => Math.exp(-((epsilon * r) ** 2))
const thinPlate = (r: number) => (r > 0 ? r * r * Math.log(r) : 0)
const constantTerm = () => [1]
const linearTerms = (x: Coord) => [1, x[0], x[1]]

function regression(basis: (x: Coord) => number[]): Smoother {
  return (train, query) => {
    const rows = train.map(basis)
    const size = rows[0].length
    if (train.length < size) return null
    const normal = Array.from({ length: size }, (_, i) =>
      Array.from({ length: size }, (_, j) => rows.reduce((sum, row) => sum + row[i] * row[j], 0))
    )
    const solution = solve(normal, basis(query))
    if (!solution) return null
    return rows.map((row) => row.reduce((sum, value, i) => sum + value * solution[i], 0))
  }
}

function radialBasis(
  kernel: (r: number) => number,
  polynomial: (x: Coord) => number[],
  smoothing = 0
): Smoother {
  return (train, query) => {
    const n = train.length
    const terms = train.map(polynomial)
    const p = terms[0].length
    const system = Array.from({ length: n + p }, () => new Array(n + p).fill(0))
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        system[i][j] = kernel(distance(train[i], train[j])) + (i === j ? smoothing : 0)
      }
      for (let k = 0; k < p; k += 1) {
        system[i][n + k] = terms[i][k]
        system[n + k][i] = terms[i][k]
      }
    }
    const solution = solve(system, [
      ...train.map((x) => kernel(distance(query, x))),
      ...polynomial(query),
    ])
    return solution ? solution.slice(0, n) : null
  }
}

function kernelAverage(epsilon: number | 'mean-distance'): Smoother {
  return (train, query) => {
    let shape = epsilon as number
    if (epsilon === 'mean-distance') {
      const distances: number[] = []
      for (let i = 0; i < train.length; i += 1) {
        for (let j = i + 1; j < train.length; j += 1) distances.push(distance(train[i], train[j]))
      }
      shape = 1 / mean(distances)
    }
    const weights = train.map((x) => Math.exp(-((shape * distance(query, x)) ** 2)))
    const total = weights.reduce((sum, w) => sum + w, 0)
    return total > 0 ? weights.map((w) => w / total) : null
  }
}

const adoptedSmoother: Smoother = (train, query) =>
  profileWeights(
    { temperature: query[0], speed: query[1] },
    train.map(([temperature, speed]) => ({ temperature, speed }))
  )

const CANDIDATES: Candidate[] = [
  {
    name: 'Média global (referência ingênua)',
    smoother: () => (train) => train.map(() => 1 / train.length),
  },
  {
    name: 'Média ponderada gaussiana, ε = 1/distância média',
    current: true,
    smoother: () => kernelAverage('mean-distance'),
  },
  { name: 'Média ponderada gaussiana, ε ajustado', smoother: () => kernelAverage(1) },
  {
    name: 'RBF gaussiana interpolante + constante, ε ajustado',
    smoother: () => radialBasis(gaussian(1), constantTerm),
  },
  {
    name: 'Spline de placa fina interpolante + plano',
    smoother: () => radialBasis(thinPlate, linearTerms),
  },
  {
    name: 'Spline de placa fina suavizante + plano, λ ajustado',
    smoother: () => radialBasis(thinPlate, linearTerms),
  },
  { name: 'Regressão 1 + v', smoother: () => regression((x) => [1, x[1]]) },
  { name: 'Regressão linear 1 + T + v', adopted: true, smoother: () => adoptedSmoother },
  {
    name: 'Regressão 1 + T + v + T·v',
    smoother: () => regression((x) => [1, x[0], x[1], x[0] * x[1]]),
  },
  {
    name: 'Regressão 1 + T + v + v²',
    smoother: () => regression((x) => [1, x[0], x[1], x[1] * x[1]]),
  },
  {
    name: 'Regressão quadrática completa',
    smoother: () => regression((x) => [1, x[0], x[1], x[0] * x[0], x[1] * x[1], x[0] * x[1]]),
  },
]

const TUNED: Record<string, { grid: number[]; make: (h: number) => Smoother }> = {
  'Média ponderada gaussiana, ε ajustado': { grid: EPSILON_GRID, make: (h) => kernelAverage(h) },
  'RBF gaussiana interpolante + constante, ε ajustado': {
    grid: EPSILON_GRID,
    make: (h) => radialBasis(gaussian(h), constantTerm),
  },
  'Spline de placa fina suavizante + plano, λ ajustado': {
    grid: LAMBDA_GRID,
    make: (h) => radialBasis(thinPlate, linearTerms, h),
  },
}

function curveAt(strains: number[], stresses: number[], strain: number) {
  if (strain >= strains[strains.length - 1]) return stresses[stresses.length - 1]
  for (let i = 1; i < strains.length; i += 1) {
    if (strains[i] >= strain) {
      const t = (strain - strains[i - 1]) / (strains[i] - strains[i - 1] || 1)
      return stresses[i - 1] + t * (stresses[i] - stresses[i - 1])
    }
  }
  return stresses[stresses.length - 1]
}

function curveRmseAgainst(prediction: CurveVector, specimen: ComparisonSpecimen) {
  const predictedStrains = U.map((u) => u * prediction.strain)
  const points = downsample(specimen.ascending, 300)
  const strains = points.map((point) => point.strain)
  const stresses = points.map((point) => point.stress)
  const top = Math.max(prediction.strain, strains[strains.length - 1])
  let squares = 0
  for (let k = 0; k < COMPARISON_POINTS; k += 1) {
    const strain = (k / (COMPARISON_POINTS - 1)) * top
    squares +=
      (curveAt(predictedStrains, prediction.stress, strain) - curveAt(strains, stresses, strain)) **
      2
  }
  return squares / COMPARISON_POINTS
}

function toVector(point: RambergOsgoodTrainingPoint): CurveVector {
  return {
    strain: point.maxStrain,
    stress: U.map((u) => calculateStress(u * point.maxStrain, point)),
  }
}

export function compareMetamodels(
  specimens: ComparisonSpecimen[],
  training: RambergOsgoodTrainingPoint[]
) {
  const vectors = training.map(toVector)
  const groupOf = (profile: string) => specimens.filter((specimen) => specimen.profile === profile)

  function normalizer(indices: number[]) {
    const temperatures = indices.map((i) => training[i].temperature)
    const speeds = indices.map((i) => training[i].speed)
    const t0 = Math.min(...temperatures)
    const t1 = Math.max(...temperatures)
    const v0 = Math.min(...speeds)
    const v1 = Math.max(...speeds)
    return (point: { temperature: number; speed: number }): Coord => [
      (point.temperature - t0) / (t1 - t0 || 1),
      (point.speed - v0) / (v1 - v0 || 1),
    ]
  }

  function predictWith(
    smoother: Smoother,
    indices: number[],
    query: { temperature: number; speed: number },
    source = vectors
  ) {
    const raw = smoother === adoptedSmoother
    const normalize = normalizer(indices)
    const toCoord = (point: { temperature: number; speed: number }): Coord =>
      raw ? [point.temperature, point.speed] : normalize(point)
    const weights = smoother(
      indices.map((i) => toCoord(training[i])),
      toCoord(query)
    )
    if (!weights) return null
    return {
      strain: weights.reduce((sum, w, k) => sum + w * source[indices[k]].strain, 0),
      stress: U.map((_, u) =>
        weights.reduce((sum, w, k) => sum + w * source[indices[k]].stress[u], 0)
      ),
      weights,
    }
  }

  function vectorError(prediction: CurveVector, target: number) {
    const reference = vectors[target]
    const scale = Math.max(...reference.stress)
    const stressPart = mean(prediction.stress.map((value, u) => (value - reference.stress[u]) ** 2))
    const strainPart = (((prediction.strain - reference.strain) / reference.strain) * scale) ** 2
    return stressPart + strainPart
  }

  function predictCandidate(
    candidate: Candidate,
    indices: number[],
    query: { temperature: number; speed: number }
  ): Prediction | null {
    const tuning = TUNED[candidate.name]
    if (!tuning) {
      const prediction = predictWith(candidate.smoother(), indices, query)
      return prediction ? { ...prediction, hyper: null } : null
    }
    let best: number | null = null
    let bestError = Number.POSITIVE_INFINITY
    for (const h of tuning.grid) {
      let error = 0
      let valid = true
      for (const inner of indices) {
        const prediction = predictWith(
          tuning.make(h),
          indices.filter((i) => i !== inner),
          training[inner]
        )
        if (!prediction) {
          valid = false
          break
        }
        error += vectorError(prediction, inner)
      }
      if (valid && error < bestError) {
        bestError = error
        best = h
      }
    }
    if (best === null) return null
    const prediction = predictWith(tuning.make(best), indices, query)
    return prediction ? { ...prediction, hyper: best } : null
  }

  function evaluate(prediction: CurveVector, profile: string) {
    const group = groupOf(profile)
    return {
      curveRmse: Math.sqrt(mean(group.map((specimen) => curveRmseAgainst(prediction, specimen)))),
      stressError:
        Math.max(...prediction.stress) - mean(group.map((specimen) => specimen.maxStress)),
      strainError:
        prediction.strain -
        mean(group.map((specimen) => specimen.ascending[specimen.ascending.length - 1].strain)),
    }
  }

  function leverage(indices: number[], query: { temperature: number; speed: number }) {
    const weights = profileWeights(
      query,
      indices.map((i) => training[i])
    )
    return weights.reduce((sum, w) => sum + w * w, 0)
  }

  const all = training.map((_, i) => i)
  const temperatures = [...new Set(training.map((point) => point.temperature))].sort(
    (a, b) => a - b
  )
  const speeds = [...new Set(training.map((point) => point.speed))].sort((a, b) => a - b)
  const schemes = [
    {
      name: 'deixa uma condição de fora',
      folds: all.map((i) => [i]),
    },
    {
      name: 'deixa um nível inteiro de fora',
      folds: [
        ...temperatures.map((t) => all.filter((i) => training[i].temperature === t)),
        ...speeds.map((v) => all.filter((i) => training[i].speed === v)),
      ],
    },
  ]

  const foldRows: FoldResult[] = []
  for (const scheme of schemes) {
    for (const candidate of CANDIDATES) {
      for (const fold of scheme.folds) {
        const indices = all.filter((i) => !fold.includes(i))
        for (const target of fold) {
          const prediction = predictCandidate(candidate, indices, training[target])
          const metrics = prediction
            ? evaluate(prediction, training[target].profile)
            : { curveRmse: Number.NaN, stressError: Number.NaN, strainError: Number.NaN }
          foldRows.push({
            scheme: scheme.name,
            model: candidate.name,
            condition: training[target].profile,
            ...metrics,
            hyper: prediction?.hyper ?? null,
            leverage: leverage(indices, training[target]),
          })
        }
      }
    }
  }

  const ownFit = training.map((point, i) => ({
    condition: point.profile,
    ...evaluate(vectors[i], point.profile),
  }))

  const summaryRows = schemes.flatMap((scheme) => [
    {
      esquema: scheme.name,
      modelo: 'Ajuste da própria condição (piso, não é previsão)',
      previsoes: ownFit.length,
      rmse_curva_mpa: mean(ownFit.map((row) => row.curveRmse)),
      mae_tensao_max_mpa: mean(ownFit.map((row) => Math.abs(row.stressError))),
      mae_deformacao_pico_pp: 100 * mean(ownFit.map((row) => Math.abs(row.strainError))),
      hiperparametros: '',
    },
    ...CANDIDATES.map((candidate) => {
      const rows = foldRows.filter(
        (row) =>
          row.scheme === scheme.name &&
          row.model === candidate.name &&
          Number.isFinite(row.curveRmse)
      )
      return {
        esquema: scheme.name,
        modelo: candidate.name,
        previsoes: rows.length,
        rmse_curva_mpa: rows.length ? mean(rows.map((row) => row.curveRmse)) : null,
        mae_tensao_max_mpa: rows.length ? mean(rows.map((row) => Math.abs(row.stressError))) : null,
        mae_deformacao_pico_pp: rows.length
          ? 100 * mean(rows.map((row) => Math.abs(row.strainError)))
          : null,
        hiperparametros: [...new Set(rows.map((row) => row.hyper).filter((h) => h !== null))].join(
          ' / '
        ),
      }
    }),
  ])

  const adopted = CANDIDATES.find((candidate) => candidate.adopted)!
  const current = CANDIDATES.find((candidate) => candidate.current)!
  const pairedTests = schemes.map((scheme) => {
    const pick = (model: string) =>
      foldRows.filter((row) => row.scheme === scheme.name && row.model === model)
    const a = pick(adopted.name)
    const b = pick(current.name)
    const curveDiffs = a.map((row, i) => row.curveRmse - b[i].curveRmse)
    const stressDiffs = a.map((row, i) => Math.abs(row.stressError) - Math.abs(b[i].stressError))
    return {
      esquema: scheme.name,
      previsoes: a.length,
      melhores_rmse_curva: curveDiffs.filter((d) => d < 0).length,
      wilcoxon_p_rmse_curva: wilcoxonSignedRank(curveDiffs),
      melhores_tensao_max: stressDiffs.filter((d) => d < 0).length,
      wilcoxon_p_tensao_max: wilcoxonSignedRank(stressDiffs),
    }
  })

  const nestedRows = all.map((target) => {
    const indices = all.filter((i) => i !== target)
    let chosen = CANDIDATES[1]
    let chosenError = Number.POSITIVE_INFINITY
    for (const candidate of CANDIDATES.slice(1)) {
      let error = 0
      let valid = true
      for (const inner of indices) {
        const prediction = predictCandidate(
          candidate,
          indices.filter((i) => i !== inner),
          training[inner]
        )
        if (!prediction) {
          valid = false
          break
        }
        error += evaluate(prediction, training[inner].profile).curveRmse ** 2
      }
      if (valid && error < chosenError) {
        chosenError = error
        chosen = candidate
      }
    }
    const prediction = predictCandidate(chosen, indices, training[target])!
    return {
      condicao: training[target].profile,
      modelo_escolhido: chosen.name,
      ...evaluate(prediction, training[target].profile),
    }
  })

  const lackOfFitRows = (
    [
      ['Regressão linear 1 + T + v', (x: Coord) => [1, x[0], x[1]]],
      ['Regressão 1 + T + v + T·v', (x: Coord) => [1, x[0], x[1], x[0] * x[1]]],
      ['Regressão 1 + T + v + v²', (x: Coord) => [1, x[0], x[1], x[1] * x[1]]],
    ] as const
  ).flatMap(([model, basis]) =>
    (
      [
        ['tensão máxima', (s: ComparisonSpecimen) => s.maxStress],
        [
          'deformação na tensão máxima',
          (s: ComparisonSpecimen) => s.ascending[s.ascending.length - 1].strain,
        ],
        ['módulo aparente', (s: ComparisonSpecimen) => s.apparentModulus],
        ['tenacidade', (s: ComparisonSpecimen) => s.toughness],
      ] as const
    ).map(([property, getter]) => ({
      modelo: model,
      propriedade: property,
      ...lackOfFit(specimens, basis, getter),
    }))
  )

  const varianceRows = (
    [
      ['tensão máxima', (s: ComparisonSpecimen) => s.maxStress],
      [
        'deformação na tensão máxima',
        (s: ComparisonSpecimen) => s.ascending[s.ascending.length - 1].strain,
      ],
      ['módulo aparente', (s: ComparisonSpecimen) => s.apparentModulus],
    ] as const
  ).map(([property, getter]) => ({ propriedade: property, ...bartlett(specimens, getter) }))

  const atTestedConditions = specimens.map((specimen) => {
    const index = training.findIndex((point) => point.profile === specimen.profile)
    const others = groupOf(specimen.profile).filter((other) => other.code !== specimen.code)
    const refit = buildTrainingPoint({
      profile: specimen.profile,
      temperature: specimen.temperature,
      speed: specimen.speed,
      tests: others.map((other) => other.ascending),
    })!
    const source = vectors.map((vector, i) => (i === index ? toVector(refit) : vector))
    const regressionPrediction = predictWith(adoptedSmoother, all, training[index], source)!
    return {
      codigo: specimen.code,
      condicao: specimen.profile,
      rmse_curva_condicao_mpa: Math.sqrt(curveRmseAgainst(source[index], specimen)),
      rmse_curva_regressao_mpa: Math.sqrt(curveRmseAgainst(regressionPrediction, specimen)),
    }
  })
  const testedDiffs = atTestedConditions.map(
    (row) => row.rmse_curva_regressao_mpa - row.rmse_curva_condicao_mpa
  )

  const validatedLeverage = Math.max(
    ...foldRows
      .filter((row) => row.scheme === schemes[1].name && row.model === adopted.name)
      .map((row) => row.leverage)
  )
  const temperatureMargin = Math.min(...temperatures.slice(1).map((t, i) => t - temperatures[i]))
  const speedMargin = Math.min(...speeds.slice(1).map((v, i) => v - speeds[i]))
  const domainCorners = [
    temperatures[0] - temperatureMargin,
    temperatures[temperatures.length - 1] + temperatureMargin,
  ].flatMap((temperature) =>
    [speeds[0] - speedMargin, speeds[speeds.length - 1] + speedMargin].map((speed) => ({
      temperature,
      speed,
    }))
  )
  const domainLeverage = Math.max(...domainCorners.map((corner) => leverage(all, corner)))

  const modulusErrors = (model: Candidate) =>
    mean(
      all.map((target) => {
        const prediction = predictCandidate(
          model,
          all.filter((i) => i !== target),
          training[target]
        )!
        const modulusOf = (vector: CurveVector) =>
          calculatePropertiesFromCurve(
            U.map((u, k) => ({ strain: u * vector.strain, stress: vector.stress[k] }))
          ).modulus
        return Math.abs(modulusOf(prediction) - modulusOf(vectors[target]))
      })
    )

  return {
    summaryRows,
    foldRows: foldRows.map((row) => ({
      esquema: row.scheme,
      modelo: row.model,
      condicao: row.condition,
      rmse_curva_mpa: row.curveRmse,
      erro_tensao_max_mpa: row.stressError,
      erro_deformacao_pico_pp: 100 * row.strainError,
      hiperparametro: row.hyper,
    })),
    lackOfFitRows,
    varianceRows,
    testedConditionRows: atTestedConditions,
    nestedRows,
    summary: {
      modelo_adotado: adopted.name,
      modelo_anterior: current.name,
      testes_pareados: pairedTests,
      selecao_aninhada: {
        rmse_curva_medio_mpa: mean(nestedRows.map((row) => row.curveRmse)),
        escolhas: Object.fromEntries(
          [...new Set(nestedRows.map((row) => row.modelo_escolhido))].map((name) => [
            name,
            nestedRows.filter((row) => row.modelo_escolhido === name).length,
          ])
        ),
      },
      condicoes_ensaiadas: {
        rmse_curva_condicao_mpa: mean(atTestedConditions.map((row) => row.rmse_curva_condicao_mpa)),
        rmse_curva_regressao_mpa: mean(
          atTestedConditions.map((row) => row.rmse_curva_regressao_mpa)
        ),
        corpos_de_prova: atTestedConditions.length,
        regressao_melhor_em: testedDiffs.filter((d) => d < 0).length,
        wilcoxon_p: wilcoxonSignedRank(testedDiffs),
      },
      dominio_validado: {
        temperatura_c: [
          temperatures[0] - temperatureMargin,
          temperatures[temperatures.length - 1] + temperatureMargin,
        ],
        velocidade_mm_s: [speeds[0] - speedMargin, speeds[speeds.length - 1] + speedMargin],
        alavancagem_maxima_no_dominio: domainLeverage,
        alavancagem_maxima_validada: validatedLeverage,
      },
      modulo_mae_mpa: {
        adotado: modulusErrors(adopted),
        anterior: modulusErrors(current),
      },
    },
  }
}

function wilcoxonSignedRank(differences: number[]): number {
  const values = differences.filter((d) => Number.isFinite(d) && d !== 0)
  const n = values.length
  if (!n) return 1
  const order = values.map((d, i) => ({ size: Math.abs(d), i })).sort((a, b) => a.size - b.size)
  const ranks = new Array<number>(n).fill(0)
  for (let start = 0; start < n; ) {
    let end = start
    while (end + 1 < n && order[end + 1].size === order[start].size) end += 1
    for (let k = start; k <= end; k += 1) ranks[order[k].i] = (start + end) / 2 + 1
    start = end + 1
  }
  const total = (n * (n + 1)) / 2
  const positive = values.reduce((sum, d, i) => sum + (d > 0 ? ranks[i] : 0), 0)
  const observed = Math.min(positive, total - positive)
  if (n <= 20) {
    let extreme = 0
    for (let mask = 0; mask < 1 << n; mask += 1) {
      let sum = 0
      for (let i = 0; i < n; i += 1) if (mask & (1 << i)) sum += ranks[i]
      if (Math.min(sum, total - sum) <= observed + 1e-9) extreme += 1
    }
    return extreme / 2 ** n
  }
  const sd = Math.sqrt((n * (n + 1) * (2 * n + 1)) / 24)
  const z = (observed - total / 2) / sd
  return Math.min(1, 2 * normalCdf(z))
}

function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z))
  const poly =
    t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  const tail = (Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI)) * poly
  return z < 0 ? tail : 1 - tail
}

function lackOfFit(
  specimens: ComparisonSpecimen[],
  basis: (x: Coord) => number[],
  getter: (specimen: ComparisonSpecimen) => number
) {
  const temperatures = specimens.map((s) => s.temperature)
  const speeds = specimens.map((s) => s.speed)
  const t0 = Math.min(...temperatures)
  const t1 = Math.max(...temperatures)
  const v0 = Math.min(...speeds)
  const v1 = Math.max(...speeds)
  const rows = specimens.map((s) =>
    basis([(s.temperature - t0) / (t1 - t0 || 1), (s.speed - v0) / (v1 - v0 || 1)])
  )
  const y = specimens.map(getter)
  const size = rows[0].length
  const normal = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => rows.reduce((sum, row) => sum + row[i] * row[j], 0))
  )
  const beta = solve(
    normal,
    Array.from({ length: size }, (_, i) => rows.reduce((sum, row, k) => sum + row[i] * y[k], 0))
  )!
  const residualSquares = y.reduce(
    (sum, value, k) => sum + (value - rows[k].reduce((acc, x, i) => acc + x * beta[i], 0)) ** 2,
    0
  )
  const profiles = [...new Set(specimens.map((s) => s.profile))]
  const pureErrorSquares = profiles.reduce((sum, profile) => {
    const values = specimens.filter((s) => s.profile === profile).map(getter)
    const m = mean(values)
    return sum + values.reduce((acc, value) => acc + (value - m) ** 2, 0)
  }, 0)
  const pureErrorDegrees = specimens.length - profiles.length
  const lackDegrees = profiles.length - size
  const f =
    (residualSquares - pureErrorSquares) / lackDegrees / (pureErrorSquares / pureErrorDegrees)
  return {
    F: f,
    gl_falta_de_ajuste: lackDegrees,
    gl_erro_puro: pureErrorDegrees,
    p: fSurvival(f, lackDegrees, pureErrorDegrees),
  }
}

function bartlett(
  specimens: ComparisonSpecimen[],
  getter: (specimen: ComparisonSpecimen) => number
) {
  const profiles = [...new Set(specimens.map((s) => s.profile))]
  const groups = profiles.map((profile) =>
    specimens.filter((s) => s.profile === profile).map(getter)
  )
  const k = groups.length
  const total = groups.reduce((sum, group) => sum + group.length, 0)
  const variances = groups.map((group) => {
    const m = mean(group)
    return group.reduce((sum, value) => sum + (value - m) ** 2, 0) / (group.length - 1)
  })
  const pooled =
    groups.reduce((sum, group, i) => sum + (group.length - 1) * variances[i], 0) / (total - k)
  const numerator =
    (total - k) * Math.log(pooled) -
    groups.reduce((sum, group, i) => sum + (group.length - 1) * Math.log(variances[i]), 0)
  const correction =
    1 +
    (groups.reduce((sum, group) => sum + 1 / (group.length - 1), 0) - 1 / (total - k)) /
      (3 * (k - 1))
  const statistic = numerator / correction
  return {
    qui_quadrado: statistic,
    gl: k - 1,
    p: chiSquareSurvival(statistic, k - 1),
    desvio_padrao_min: Math.sqrt(Math.min(...variances)),
    desvio_padrao_max: Math.sqrt(Math.max(...variances)),
  }
}
