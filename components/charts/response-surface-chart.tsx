'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import type { PredictionResult, RambergOsgoodTrainingPoint, StressStrainPoint } from '@/types'
import { rbfCurveInterpolation, rbfInterpolation } from '@/lib/metamodel'
import { cn } from '@/lib/utils'
import { calculatePropertiesFromCurve } from '@/lib/mechanical-properties'
import { useSettings } from '@/components/settings-provider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type CurveMetricKey = 'ultimateStress' | 'ductility' | 'modulus' | 'toughness'

type MetricKey = CurveMetricKey | 'E' | 'sigma_0' | 'n'

type MetricConfig = {
  key: MetricKey
  label: string
  unit: string
  description: string
  modelParameter: boolean
  formatter: (value: number) => string
}

type SurfacePoint = {
  temperature: number
  speed: number
  values: Record<MetricKey, number>
}

type ResponseSurfaceChartProps = {
  trainingData: RambergOsgoodTrainingPoint[]
  result: PredictionResult | null
  className?: string
}

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const stressFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const modulusFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
})

const METRICS: MetricConfig[] = [
  {
    key: 'ultimateStress',
    label: 'Tensão máxima',
    unit: 'MPa',
    description: 'Maior tensão da curva prevista.',
    modelParameter: false,
    formatter: (value) => stressFormatter.format(value),
  },
  {
    key: 'ductility',
    label: 'Deformação na tensão máxima',
    unit: '%',
    description: 'Deformação em que a curva prevista atinge a tensão máxima.',
    modelParameter: false,
    formatter: (value) => numberFormatter.format(value),
  },
  {
    key: 'modulus',
    label: 'Módulo aparente',
    unit: 'MPa',
    description: 'Inclinação do trecho inicial da curva prevista.',
    modelParameter: false,
    formatter: (value) => modulusFormatter.format(value),
  },
  {
    key: 'toughness',
    label: 'Tenacidade até a tensão máxima',
    unit: 'MJ/m³',
    description: 'Energia por volume absorvida até a tensão máxima.',
    modelParameter: false,
    formatter: (value) => numberFormatter.format(value),
  },
  {
    key: 'E',
    label: 'Parâmetro E do modelo',
    unit: 'MPa',
    description: 'Rigidez do ajuste de Ramberg-Osgood.',
    modelParameter: true,
    formatter: (value) => modulusFormatter.format(value),
  },
  {
    key: 'sigma_0',
    label: 'Parâmetro σ₀ do modelo',
    unit: 'MPa',
    description: 'Tensão de referência do ajuste de Ramberg-Osgood.',
    modelParameter: true,
    formatter: (value) => stressFormatter.format(value),
  },
  {
    key: 'n',
    label: 'Parâmetro n do modelo',
    unit: '',
    description: 'Expoente do ajuste de Ramberg-Osgood.',
    modelParameter: true,
    formatter: (value) => numberFormatter.format(value),
  },
]

function mapColor(t: number) {
  const clamped = Math.max(0, Math.min(1, t))
  const color = new THREE.Color()
  color.setHSL(0.6 - 0.58 * clamped, 0.55, 0.48)
  return color
}

function curveMetrics(curve: StressStrainPoint[]): Record<CurveMetricKey, number> {
  const { ultimateStress, ductility, modulus, toughness } = calculatePropertiesFromCurve(curve)
  return { ultimateStress, ductility, modulus, toughness }
}

export function ResponseSurfaceChart({
  trainingData,
  result,
  className,
}: ResponseSurfaceChartProps) {
  const { settings } = useSettings()
  const [metricKey, setMetricKey] = useState<MetricKey>('ultimateStress')
  const [isReady, setIsReady] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const curvePoints = result?.curve.length ? result.curve.length - 1 : settings.stressCurvePoints

  const gridData = useMemo(() => {
    const validTraining = trainingData.filter(
      (point) =>
        Number.isFinite(point.temperature) &&
        point.temperature > 0 &&
        Number.isFinite(point.speed) &&
        point.speed > 0 &&
        Number.isFinite(point.E) &&
        point.E > 0 &&
        Number.isFinite(point.sigma_0) &&
        point.sigma_0 > 0 &&
        Number.isFinite(point.n) &&
        point.n > 0 &&
        Number.isFinite(point.maxStrain) &&
        point.maxStrain > 0
    )
    if (validTraining.length < 2) return null

    const temperatures = validTraining.map((point) => point.temperature)
    const speeds = validTraining.map((point) => point.speed)
    const tempMin = Math.min(...temperatures)
    const tempMax = Math.max(...temperatures)
    const speedMin = Math.min(...speeds)
    const speedMax = Math.max(...speeds)
    const tempRange = tempMax - tempMin || 1
    const speedRange = speedMax - speedMin || 1
    const maxRange = Math.max(tempRange, speedRange) || 1

    const baseResolution = 26
    const minResolution = 14
    const cols = Math.max(minResolution, Math.round(baseResolution * (tempRange / maxRange)))
    const rows = Math.max(minResolution, Math.round(baseResolution * (speedRange / maxRange)))
    const points: SurfacePoint[] = []

    for (let row = 0; row < rows; row += 1) {
      const speed = speedMin + (speedRange * row) / (rows - 1)
      for (let col = 0; col < cols; col += 1) {
        const temperature = tempMin + (tempRange * col) / (cols - 1)
        const input = { temperature, speed }
        const { curve } = rbfCurveInterpolation(input, validTraining, curvePoints, {
          exactMatch: false,
        })
        const params = rbfInterpolation(input, validTraining, { exactMatch: false })

        points.push({
          temperature,
          speed,
          values: { ...curveMetrics(curve), E: params.E, sigma_0: params.sigma_0, n: params.n },
        })
      }
    }

    const trainingPoints: SurfacePoint[] = validTraining.map((point) => {
      const input = { temperature: point.temperature, speed: point.speed }
      const { curve } = rbfCurveInterpolation(input, validTraining, curvePoints)
      return {
        ...input,
        values: { ...curveMetrics(curve), E: point.E, sigma_0: point.sigma_0, n: point.n },
      }
    })

    return {
      points,
      trainingPoints,
      bounds: { tempMin, tempMax, speedMin, speedMax },
      cols,
      rows,
      axisScale: {
        width: (tempRange / maxRange) * 1.6,
        depth: (speedRange / maxRange) * 1.2,
      },
      meta: {
        profiles: validTraining.length,
        discarded: trainingData.length - validTraining.length,
      },
    }
  }, [trainingData, curvePoints])

  const predictionPoint = useMemo((): SurfacePoint | null => {
    if (!result) return null
    const { ultimateStress, ductility, modulus, toughness } = result.properties
    const { E, sigma_0, n } = result.rambergOsgood
    return {
      temperature: result.input.temperature,
      speed: result.input.speed,
      values: { ultimateStress, ductility, modulus, toughness, E, sigma_0, n },
    }
  }, [result])

  const surface = useMemo(() => {
    if (!gridData) return null
    const values = gridData.points.map((point) => point.values[metricKey])
    const testedValues = gridData.trainingPoints.map((point) => point.values[metricKey])
    const predictionValues = predictionPoint ? [predictionPoint.values[metricKey]] : []
    const scaleValues = [...values, ...testedValues, ...predictionValues]
    const zMin = Math.min(...values)
    const zMax = Math.max(...values)
    const scaleMin = Math.min(...scaleValues)
    const scaleMax = Math.max(...scaleValues)
    if (!Number.isFinite(scaleMin) || !Number.isFinite(scaleMax)) return null
    return {
      zMin,
      zMax,
      testedMin: Math.min(...testedValues),
      testedMax: Math.max(...testedValues),
      scaleMin,
      scaleMax,
    }
  }, [gridData, metricKey, predictionPoint])

  const metric = METRICS.find((entry) => entry.key === metricKey) ?? METRICS[0]

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined
    const observer = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect()
      if (width > 0 && height > 0) {
        setIsReady(true)
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!containerRef.current || !gridData || !surface || !isReady) return undefined

    const container = containerRef.current
    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect()
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio ?? 1)
    renderer.setSize(containerWidth, containerHeight)
    renderer.setClearColor(0xffffff, 0)
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, containerWidth / containerHeight, 0.1, 100)
    camera.position.set(1.8, -1.4, 1.3)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.target.set(0, 0, 0.25)
    controls.update()

    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    const directional = new THREE.DirectionalLight(0xffffff, 0.7)
    directional.position.set(2, 1.2, 1.8)
    scene.add(ambient, directional)

    const { width, depth } = gridData.axisScale
    const height = 0.7
    const zRange = surface.zMax - surface.zMin || 1
    const scaleRange = surface.scaleMax - surface.scaleMin || 1

    const mapX = (temperature: number) => {
      const ratio =
        (temperature - gridData.bounds.tempMin) /
        (gridData.bounds.tempMax - gridData.bounds.tempMin || 1)
      return (ratio - 0.5) * width
    }
    const mapY = (speed: number) => {
      const ratio =
        (speed - gridData.bounds.speedMin) /
        (gridData.bounds.speedMax - gridData.bounds.speedMin || 1)
      return (ratio - 0.5) * depth
    }
    const mapZ = (value: number) => ((value - surface.scaleMin) / scaleRange) * height

    const geometry = new THREE.PlaneGeometry(width, depth, gridData.cols - 1, gridData.rows - 1)
    const positions = geometry.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(positions.count * 3)

    gridData.points.forEach((point, index) => {
      const value = point.values[metricKey]
      positions.setXYZ(index, mapX(point.temperature), mapY(point.speed), mapZ(value))
      const color = mapColor((value - surface.zMin) / zRange)
      colors[index * 3] = color.r
      colors[index * 3 + 1] = color.g
      colors[index * 3 + 2] = color.b
    })

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.computeVertexNormals()

    const surfaceMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.35,
      metalness: 0.2,
      transparent: true,
      opacity: 0.95,
    })
    const surfaceMesh = new THREE.Mesh(geometry, surfaceMaterial)
    scene.add(surfaceMesh)

    const wireframeGeometry = new THREE.WireframeGeometry(geometry)
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.2,
    })
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial)
    scene.add(wireframe)

    const axisGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-width / 2, -depth / 2, 0),
      new THREE.Vector3(width / 2, -depth / 2, 0),
      new THREE.Vector3(-width / 2, -depth / 2, 0),
      new THREE.Vector3(-width / 2, depth / 2, 0),
      new THREE.Vector3(-width / 2, -depth / 2, 0),
      new THREE.Vector3(-width / 2, -depth / 2, height),
    ])
    const axisMaterial = new THREE.LineBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.55,
    })
    const axisLines = new THREE.LineSegments(axisGeometry, axisMaterial)
    scene.add(axisLines)

    let pointsGeometry: THREE.BufferGeometry | null = null
    let pointsMaterial: THREE.PointsMaterial | null = null
    if (gridData.trainingPoints.length) {
      const positions = new Float32Array(gridData.trainingPoints.length * 3)
      const colors = new Float32Array(gridData.trainingPoints.length * 3)
      gridData.trainingPoints.forEach((point, index) => {
        positions[index * 3] = mapX(point.temperature)
        positions[index * 3 + 1] = mapY(point.speed)
        positions[index * 3 + 2] = mapZ(point.values[metricKey])
        colors[index * 3] = 0.15
        colors[index * 3 + 1] = 0.15
        colors[index * 3 + 2] = 0.2
      })
      pointsGeometry = new THREE.BufferGeometry()
      pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      pointsMaterial = new THREE.PointsMaterial({ size: 0.035, vertexColors: true })
      const pointsMesh = new THREE.Points(pointsGeometry, pointsMaterial)
      scene.add(pointsMesh)
    }

    let predictionGeometry: THREE.SphereGeometry | null = null
    let predictionMaterial: THREE.MeshStandardMaterial | null = null
    if (predictionPoint) {
      predictionGeometry = new THREE.SphereGeometry(0.045, 18, 18)
      predictionMaterial = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0x7c2d12,
        emissiveIntensity: 0.4,
      })
      const predictionMesh = new THREE.Mesh(predictionGeometry, predictionMaterial)
      predictionMesh.position.set(
        mapX(predictionPoint.temperature),
        mapY(predictionPoint.speed),
        mapZ(predictionPoint.values[metricKey])
      )
      scene.add(predictionMesh)
    }

    let animationFrame = 0
    const render = () => {
      animationFrame = requestAnimationFrame(render)
      controls.update()
      renderer.render(scene, camera)
    }
    render()

    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    })
    resizeObserver.observe(container)

    return () => {
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      controls.dispose()
      geometry.dispose()
      surfaceMaterial.dispose()
      wireframeGeometry.dispose()
      wireframeMaterial.dispose()
      axisGeometry.dispose()
      axisMaterial.dispose()
      pointsGeometry?.dispose()
      pointsMaterial?.dispose()
      predictionGeometry?.dispose()
      predictionMaterial?.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement)
      }
    }
  }, [gridData, surface, metricKey, predictionPoint, isReady])

  if (!trainingData.length) {
    return (
      <div className="h-80 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">
          Nenhum dado real disponivel para gerar a superficie.
        </p>
      </div>
    )
  }

  if (!gridData || !surface) {
    return (
      <div className="h-80 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">Dados insuficientes para interpolacao 3D.</p>
      </div>
    )
  }

  const surfaceMin = metric.formatter(surface.zMin)
  const surfaceMax = metric.formatter(surface.zMax)
  const surfaceSpan = metric.formatter(surface.zMax - surface.zMin)
  const predictionValue = predictionPoint
    ? metric.formatter(predictionPoint.values[metricKey])
    : null
  const isTestedCondition =
    predictionPoint !== null &&
    gridData.trainingPoints.some(
      (point) =>
        point.temperature === predictionPoint.temperature && point.speed === predictionPoint.speed
    )
  const metricUnitLabel = metric.unit || 'adimensional'

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Superficie de Resposta 3D</p>
          <p className="text-xs text-muted-foreground">{metric.description}</p>
        </div>
        <Select value={metricKey} onValueChange={(value) => setMetricKey(value as MetricKey)}>
          <SelectTrigger className="min-w-[220px]">
            <SelectValue placeholder="Selecione a metrica" />
          </SelectTrigger>
          <SelectContent>
            {METRICS.map((entry) => (
              <SelectItem key={entry.key} value={entry.key}>
                {entry.label} {entry.unit ? `(${entry.unit})` : '(adimensional)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {metric.modelParameter ? (
        <p className="rounded-lg border border-border bg-white dark:bg-black dark:text-white px-3 py-2 text-xs text-muted-foreground">
          E, σ₀ e n são parâmetros de ajuste do Ramberg-Osgood, não propriedades físicas
          independentes. Como o PLA rompe ainda quase em regime linear, combinações muito diferentes
          dos três descrevem a mesma curva. Por isso o ajuste de cada condição e o da previsão podem
          ficar longe desta superfície, que mostra só a média ponderada dos ajustes.
        </p>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="flex flex-col rounded-xl border border-border bg-white dark:bg-black dark:text-white p-3">
          <div className="relative min-h-[360px] flex-1">
            <div className="absolute inset-0" ref={containerRef} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Arraste para rotacionar. Role para zoom.</span>
            <span>
              {metric.label} ({metricUnitLabel})
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white dark:bg-black dark:text-white p-3 space-y-3 text-xs text-muted-foreground">
          <div className="space-y-1">
            <p className="font-semibold text-foreground text-sm">Faixa prevista</p>
            <p>
              Min: <span className="font-mono text-foreground">{surfaceMin}</span> {metricUnitLabel}
            </p>
            <p>
              Max: <span className="font-mono text-foreground">{surfaceMax}</span> {metricUnitLabel}
            </p>
            <p>
              Amplitude: <span className="font-mono text-foreground">{surfaceSpan}</span>{' '}
              {metricUnitLabel}
            </p>
            <p>
              Ensaios:{' '}
              <span className="font-mono text-foreground">
                {metric.formatter(surface.testedMin)}
              </span>{' '}
              a{' '}
              <span className="font-mono text-foreground">
                {metric.formatter(surface.testedMax)}
              </span>{' '}
              {metricUnitLabel}
            </p>
            {predictionValue ? (
              <p>
                Atual: <span className="font-mono text-foreground">{predictionValue}</span>{' '}
                {metricUnitLabel}
              </p>
            ) : null}
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground text-sm">Eixos</p>
            <p>
              Temperatura: {gridData.bounds.tempMin}°C → {gridData.bounds.tempMax}°C
            </p>
            <p>
              Velocidade: {gridData.bounds.speedMin} mm/s → {gridData.bounds.speedMax} mm/s
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground text-sm">Referencia</p>
            <p>{gridData.meta.profiles} perfis reais validados.</p>
            <p>
              Grade de interpolacao: {gridData.rows} x {gridData.cols} pontos.
            </p>
            <p>Interpolacao RBF (Gaussiana) com normalizacao min-max.</p>
            <p>Marcadores escuros: ensaios reais. Marcador laranja: previsao atual.</p>
            <p>
              A superfície é a média ponderada dos perfis, a mesma que a previsão usa fora das
              condições ensaiadas.
            </p>
            {isTestedCondition ? (
              <p>
                Condição ensaiada. A previsão repete o próprio ensaio em vez da média ponderada, por
                isso o marcador laranja pode ficar fora da superfície.
              </p>
            ) : null}
            {gridData.meta.discarded > 0 ? (
              <p>{gridData.meta.discarded} perfis ignorados por dados incompletos.</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
