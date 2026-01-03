'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import type { PredictionResult, RambergOsgoodTrainingPoint } from '@/types'
import { rbfInterpolation } from '@/lib/metamodel'
import { calculateMechanicalProperties } from '@/lib/mechanical-properties'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type MetricKey =
  | 'E'
  | 'sigma_0'
  | 'n'
  | 'yieldStress'
  | 'ultimateStress'
  | 'ductility'
  | 'resilience'
  | 'toughness'

type MetricConfig = {
  key: MetricKey
  label: string
  unit: string
  description: string
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
}

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const stressFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const METRICS: MetricConfig[] = [
  {
    key: 'yieldStress',
    label: 'Tensao de escoamento',
    unit: 'MPa',
    description: 'Inicio do regime plastico (offset de 0,2%).',
    formatter: (value) => stressFormatter.format(value),
  },
  {
    key: 'ultimateStress',
    label: 'Tensao maxima',
    unit: 'MPa',
    description: 'Maior tensao prevista ate o limite experimental.',
    formatter: (value) => stressFormatter.format(value),
  },
  {
    key: 'ductility',
    label: 'Ductilidade',
    unit: '%',
    description: 'Deformacao total prevista no limite experimental.',
    formatter: (value) => numberFormatter.format(value),
  },
  {
    key: 'E',
    label: 'Modulo de elasticidade (E)',
    unit: 'MPa',
    description: 'Rigidez inicial do material.',
    formatter: (value) => numberFormatter.format(value),
  },
  {
    key: 'sigma_0',
    label: 'Tensao de referencia (sigma0)',
    unit: 'MPa',
    description: 'Tensao associada ao deslocamento de 0,2%.',
    formatter: (value) => stressFormatter.format(value),
  },
  {
    key: 'n',
    label: 'Expoente de encruamento (n)',
    unit: '',
    description: 'Sensibilidade da curva a deformacao plastica.',
    formatter: (value) => numberFormatter.format(value),
  },
  {
    key: 'resilience',
    label: 'Resiliencia',
    unit: 'MJ/m³',
    description: 'Energia elastica acumulada ate o escoamento.',
    formatter: (value) => numberFormatter.format(value),
  },
  {
    key: 'toughness',
    label: 'Tenacidade',
    unit: 'MJ/m³',
    description: 'Energia total acumulada ate o limite experimental.',
    formatter: (value) => numberFormatter.format(value),
  },
]

function mapColor(t: number) {
  const clamped = Math.max(0, Math.min(1, t))
  const color = new THREE.Color()
  color.setHSL(0.6 - 0.58 * clamped, 0.55, 0.48)
  return color
}

function average(values: number[], fallback: number) {
  if (!values.length) return fallback
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function isFiniteNumber(value: number) {
  return Number.isFinite(value)
}

export function ResponseSurfaceChart({ trainingData, result }: ResponseSurfaceChartProps) {
  const [metricKey, setMetricKey] = useState<MetricKey>('yieldStress')
  const [isReady, setIsReady] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

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

    const strainValues = validTraining
      .map((point) => point.maxStrain)
      .filter((value) => isFiniteNumber(value) && value > 0)
    const fallbackParams = {
      E: average(
        validTraining.map((point) => point.E),
        3000
      ),
      sigma_0: average(
        validTraining.map((point) => point.sigma_0),
        50
      ),
      n: average(
        validTraining.map((point) => point.n),
        8
      ),
      maxStrain: average(strainValues, 0.08),
    }

    for (let row = 0; row < rows; row += 1) {
      const speed = speedMin + (speedRange * row) / (rows - 1)
      for (let col = 0; col < cols; col += 1) {
        const temperature = tempMin + (tempRange * col) / (cols - 1)
        const interpolation = rbfInterpolation({ temperature, speed }, validTraining)
        const safeE = isFiniteNumber(interpolation.E) ? interpolation.E : fallbackParams.E
        const safeSigma0 = isFiniteNumber(interpolation.sigma_0)
          ? interpolation.sigma_0
          : fallbackParams.sigma_0
        const safeN = isFiniteNumber(interpolation.n) ? interpolation.n : fallbackParams.n
        const maxStrain =
          isFiniteNumber(interpolation.maxStrain) && interpolation.maxStrain > 0
            ? interpolation.maxStrain
            : fallbackParams.maxStrain
        const properties = calculateMechanicalProperties(
          { E: safeE, sigma_0: safeSigma0, n: safeN },
          maxStrain
        )

        points.push({
          temperature,
          speed,
          values: {
            E: safeE,
            sigma_0: safeSigma0,
            n: safeN,
            yieldStress: properties.yieldStress,
            ultimateStress: properties.ultimateStress,
            ductility: properties.ductility,
            resilience: properties.resilience,
            toughness: properties.toughness,
          },
        })
      }
    }

    const trainingPoints = validTraining.map((point) => {
      const props = calculateMechanicalProperties(
        { E: point.E, sigma_0: point.sigma_0, n: point.n },
        point.maxStrain
      )
      return {
        temperature: point.temperature,
        speed: point.speed,
        values: {
          E: point.E,
          sigma_0: point.sigma_0,
          n: point.n,
          yieldStress: props.yieldStress,
          ultimateStress: props.ultimateStress,
          ductility: props.ductility,
          resilience: props.resilience,
          toughness: props.toughness,
        },
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
  }, [trainingData])

  const surface = useMemo(() => {
    if (!gridData) return null
    const values = gridData.points.map((point) => point.values[metricKey])
    const zMin = Math.min(...values)
    const zMax = Math.max(...values)
    if (!Number.isFinite(zMin) || !Number.isFinite(zMax)) return null
    return {
      values,
      zMin,
      zMax,
    }
  }, [gridData, metricKey])

  const metric = METRICS.find((entry) => entry.key === metricKey) ?? METRICS[0]

  const predictionPoint = useMemo(() => {
    if (!result) return null
    return {
      temperature: result.input.temperature,
      speed: result.input.speed,
      values: {
        E: result.rambergOsgood.E,
        sigma_0: result.rambergOsgood.sigma_0,
        n: result.rambergOsgood.n,
        yieldStress: result.properties.yieldStress,
        ultimateStress: result.properties.ultimateStress,
        ductility: result.properties.ductility,
        resilience: result.properties.resilience,
        toughness: result.properties.toughness,
      },
    }
  }, [result])

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
    const geometry = new THREE.PlaneGeometry(width, depth, gridData.cols - 1, gridData.rows - 1)
    const positions = geometry.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(positions.count * 3)
    const zRange = surface.zMax - surface.zMin || 1

    for (let index = 0; index < positions.count; index += 1) {
      const value = surface.values[index]
      const normalized = (value - surface.zMin) / zRange
      positions.setZ(index, normalized * height)
      const color = mapColor(normalized)
      colors[index * 3] = color.r
      colors[index * 3 + 1] = color.g
      colors[index * 3 + 2] = color.b
    }

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
    const mapZ = (value: number) => ((value - surface.zMin) / zRange) * height

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

  const zRange = surface.zMax - surface.zMin || 1
  const surfaceMin = metric.formatter(surface.zMin)
  const surfaceMax = metric.formatter(surface.zMax)
  const surfaceSpan = metric.formatter(zRange)
  const predictionValue = predictionPoint
    ? metric.formatter(predictionPoint.values[metricKey])
    : null
  const metricUnitLabel = metric.unit || 'adimensional'

  return (
    <div className="space-y-4">
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

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="rounded-xl border border-border bg-white p-3">
          <div className="h-[360px] w-full" ref={containerRef} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Arraste para rotacionar. Role para zoom.</span>
            <span>
              {metric.label} ({metricUnitLabel})
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-3 space-y-3 text-xs text-muted-foreground">
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
            {gridData.meta.discarded > 0 ? (
              <p>{gridData.meta.discarded} perfis ignorados por dados incompletos.</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
