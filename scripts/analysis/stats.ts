export function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function sampleStd(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  return Math.sqrt(values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1))
}

function gammaLn(x: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155,
    0.1208650973866179e-2, -0.5395239384953e-5,
  ]
  let y = x
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5)
  let ser = 1.000000000190015
  for (const coefficient of c) ser += coefficient / ++y
  return -tmp + Math.log((2.5066282746310005 * ser) / x)
}

function betaContinuedFraction(a: number, b: number, x: number): number {
  const maxIterations = 300
  const eps = 3e-14
  const fpmin = 1e-300
  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let c = 1
  let d = 1 - (qab * x) / qap
  if (Math.abs(d) < fpmin) d = fpmin
  d = 1 / d
  let h = d
  for (let m = 1; m <= maxIterations; m += 1) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < fpmin) d = fpmin
    c = 1 + aa / c
    if (Math.abs(c) < fpmin) c = fpmin
    d = 1 / d
    h *= d * c
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < fpmin) d = fpmin
    c = 1 + aa / c
    if (Math.abs(c) < fpmin) c = fpmin
    d = 1 / d
    const delta = d * c
    h *= delta
    if (Math.abs(delta - 1) < eps) break
  }
  return h
}

function regularizedBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const front = Math.exp(
    gammaLn(a + b) - gammaLn(a) - gammaLn(b) + a * Math.log(x) + b * Math.log(1 - x)
  )
  if (x < (a + 1) / (a + b + 2)) return (front * betaContinuedFraction(a, b, x)) / a
  return 1 - (front * betaContinuedFraction(b, a, 1 - x)) / b
}

export function fSurvival(f: number, d1: number, d2: number): number {
  if (f <= 0) return 1
  return regularizedBeta(d2 / (d2 + d1 * f), d2 / 2, d1 / 2)
}

function fCritical(alpha: number, d1: number, d2: number): number {
  let lo = 0
  let hi = 1000
  for (let i = 0; i < 200; i += 1) {
    const mid = (lo + hi) / 2
    if (fSurvival(mid, d1, d2) > alpha) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

function lowerGammaSeries(a: number, x: number): number {
  let term = 1 / a
  let sum = term
  for (let n = 1; n < 500; n += 1) {
    term *= x / (a + n)
    sum += term
    if (Math.abs(term) < Math.abs(sum) * 3e-14) break
  }
  return sum * Math.exp(-x + a * Math.log(x) - gammaLn(a))
}

function upperGammaContinuedFraction(a: number, x: number): number {
  const fpmin = 1e-300
  let b = x + 1 - a
  let c = 1 / fpmin
  let d = 1 / b
  let h = d
  for (let i = 1; i < 500; i += 1) {
    const an = -i * (i - a)
    b += 2
    d = an * d + b
    if (Math.abs(d) < fpmin) d = fpmin
    c = b + an / c
    if (Math.abs(c) < fpmin) c = fpmin
    d = 1 / d
    const delta = d * c
    h *= delta
    if (Math.abs(delta - 1) < 3e-14) break
  }
  return Math.exp(-x + a * Math.log(x) - gammaLn(a)) * h
}

export function chiSquareSurvival(x: number, degrees: number): number {
  if (x <= 0) return 1
  const a = degrees / 2
  const half = x / 2
  return half < a + 1 ? 1 - lowerGammaSeries(a, half) : upperGammaContinuedFraction(a, half)
}

function solveLeastSquares(X: number[][], y: number[]): number[] {
  const p = X[0].length
  const A = Array.from({ length: p }, () => new Array(p + 1).fill(0))
  for (let i = 0; i < X.length; i += 1) {
    for (let j = 0; j < p; j += 1) {
      for (let k = 0; k < p; k += 1) A[j][k] += X[i][j] * X[i][k]
      A[j][p] += X[i][j] * y[i]
    }
  }
  for (let col = 0; col < p; col += 1) {
    let pivot = col
    for (let row = col + 1; row < p; row += 1) {
      if (Math.abs(A[row][col]) > Math.abs(A[pivot][col])) pivot = row
    }
    ;[A[col], A[pivot]] = [A[pivot], A[col]]
    const diag = A[col][col]
    if (Math.abs(diag) < 1e-12) throw new Error('Matriz singular na ANOVA')
    for (let k = col; k <= p; k += 1) A[col][k] /= diag
    for (let row = 0; row < p; row += 1) {
      if (row === col) continue
      const factor = A[row][col]
      for (let k = col; k <= p; k += 1) A[row][k] -= factor * A[col][k]
    }
  }
  return A.map((row) => row[p])
}

function residualSumOfSquares(X: number[][], y: number[]): number {
  const beta = solveLeastSquares(X, y)
  return X.reduce((sum, row, i) => {
    const fitted = row.reduce((s, value, j) => s + value * beta[j], 0)
    return sum + (y[i] - fitted) ** 2
  }, 0)
}

function effectCodes(level: number, levels: number): number[] {
  return Array.from({ length: levels - 1 }, (_, j) =>
    level === levels - 1 ? -1 : level === j ? 1 : 0
  )
}

interface AnovaRow {
  source: string
  ss: number
  df: number
  ms: number
  f: number | null
  fCritical: number | null
  p: number | null
}

export function twoWayAnova(
  y: number[],
  a: number[],
  b: number[],
  levelsA: number,
  levelsB: number,
  alpha = 0.05
): AnovaRow[] {
  const n = y.length
  const columns = (i: number) => {
    const ea = effectCodes(a[i], levelsA)
    const eb = effectCodes(b[i], levelsB)
    const inter: number[] = []
    for (const u of ea) for (const v of eb) inter.push(u * v)
    return { ea, eb, inter }
  }
  const build = (include: { A: boolean; B: boolean; AB: boolean }) =>
    y.map((_, i) => {
      const { ea, eb, inter } = columns(i)
      return [1, ...(include.A ? ea : []), ...(include.B ? eb : []), ...(include.AB ? inter : [])]
    })

  const sseFull = residualSumOfSquares(build({ A: true, B: true, AB: true }), y)
  const dfA = levelsA - 1
  const dfB = levelsB - 1
  const dfAB = dfA * dfB
  const dfError = n - levelsA * levelsB
  const mse = sseFull / dfError
  const ssA = residualSumOfSquares(build({ A: false, B: true, AB: true }), y) - sseFull
  const ssB = residualSumOfSquares(build({ A: true, B: false, AB: true }), y) - sseFull
  const ssAB = residualSumOfSquares(build({ A: true, B: true, AB: false }), y) - sseFull

  const row = (source: string, ss: number, df: number): AnovaRow => {
    const f = ss / df / mse
    return {
      source,
      ss,
      df,
      ms: ss / df,
      f,
      fCritical: fCritical(alpha, df, dfError),
      p: fSurvival(f, df, dfError),
    }
  }
  return [
    row('temperatura', ssA, dfA),
    row('velocidade', ssB, dfB),
    row('interacao', ssAB, dfAB),
    { source: 'erro', ss: sseFull, df: dfError, ms: mse, f: null, fCritical: null, p: null },
  ]
}
