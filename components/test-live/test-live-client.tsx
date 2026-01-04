'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Activity, Play, RotateCcw } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StressStrainChart } from '@/components/charts/stress-strain-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import { generateStressStrainCurve } from '@/lib/ramberg-osgood'
import type { RambergOsgoodParams, StressStrainPoint } from '@/types'

const SIMULATION_DURATION_MS = 16000
const RAMBERG_PARAMS: RambergOsgoodParams = {
  E: 1200,
  sigma_0: 32,
  n: 6,
}
const MAX_STRAIN = 0.25
const CURVE_POINTS = 160
const BREAK_START = 0.9

type SimulationStatus = 'idle' | 'running' | 'finished'

const strainFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

const stressFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const statusConfig: Record<SimulationStatus, { label: string; className: string; dot: string }> = {
  idle: {
    label: 'Aguardando',
    className: 'border-border/60 bg-muted/40 text-muted-foreground',
    dot: 'bg-muted-foreground/60',
  },
  running: {
    label: 'Em execucao',
    className:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  finished: {
    label: 'Concluido',
    className:
      'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300',
    dot: 'bg-sky-500',
  },
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function getPointAtProgress(curve: StressStrainPoint[], progress: number) {
  if (!curve.length) {
    return { strain: 0, stress: 0 }
  }

  const clamped = clamp(progress, 0, 1)
  const total = curve.length - 1
  const exactIndex = clamped * total
  const index = Math.floor(exactIndex)
  const nextIndex = Math.min(index + 1, total)
  const t = exactIndex - index
  const from = curve[index]
  const to = curve[nextIndex]

  return {
    strain: lerp(from.strain, to.strain, t),
    stress: lerp(from.stress, to.stress, t),
  }
}

function buildDisplayCurve(curve: StressStrainPoint[], progress: number) {
  if (!curve.length || progress <= 0) {
    return []
  }

  const clamped = clamp(progress, 0, 1)
  const total = curve.length - 1
  const exactIndex = clamped * total
  const index = Math.floor(exactIndex)
  const nextIndex = Math.min(index + 1, total)
  const t = exactIndex - index
  const subset = curve.slice(0, index + 1)

  if (nextIndex !== index && t > 0) {
    const from = curve[index]
    const to = curve[nextIndex]
    subset.push({
      strain: lerp(from.strain, to.strain, t),
      stress: lerp(from.stress, to.stress, t),
    })
  }

  return subset
}

type SensorGaugeProps = {
  label: string
  value: number
  unit: string
  progress: number
  hint: string
}

function SensorGauge({ label, value, unit, progress, hint }: SensorGaugeProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {value.toFixed(2)} <span className="text-sm text-muted-foreground">{unit}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <span className="rounded-full border border-border/70 bg-muted/30 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Sensor
        </span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-foreground to-foreground/70 transition-[width] duration-100"
          style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }}
        />
      </div>
    </div>
  )
}

type MetricTileProps = {
  label: string
  value: string
  detail: string
}

function MetricTile({ label, value, detail }: MetricTileProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

type LiveStressStrainChartProps = {
  curve: StressStrainPoint[]
  progress: number
  maxStrain: number
  maxStress: number
  currentPoint: StressStrainPoint
}

function LiveStressStrainChart({
  curve,
  progress,
  maxStrain,
  maxStress,
  currentPoint,
}: LiveStressStrainChartProps) {
  const displayCurve = useMemo(() => buildDisplayCurve(curve, progress), [curve, progress])

  return (
    <ChartContainer
      config={{
        curve: {
          label: 'Curva Ramberg-Osgood',
          color: 'var(--chart-1)',
        },
      }}
      className="h-80 w-full aspect-auto"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={displayCurve}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            type="number"
            dataKey="strain"
            domain={[0, maxStrain]}
            tickFormatter={(value) => strainFormatter.format(value)}
            className="text-xs"
            name="Deformacao"
          />
          <YAxis
            type="number"
            domain={[0, maxStress * 1.05]}
            tickFormatter={(value) => stressFormatter.format(value)}
            className="text-xs"
            name="Tensao"
          />
          <Line
            type="monotone"
            dataKey="stress"
            stroke="var(--color-curve)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {progress > 0 && (
            <ReferenceDot
              x={currentPoint.strain}
              y={currentPoint.stress}
              r={4}
              fill="var(--color-curve)"
              stroke="var(--color-curve)"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

type SpecimenSceneProps = {
  progress: number
}

function SpecimenScene({ progress }: SpecimenSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const progressRef = useRef(progress)

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.margin = '0 auto'
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)

    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1)
    keyLight.position.set(3, 4, 2)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.55)
    fillLight.position.set(-2, 2, -3)

    scene.add(ambient, keyLight, fillLight)

    const specimenGroup = new THREE.Group()
    scene.add(specimenGroup)

    const base = {
      gripLength: 0.6,
      transitionLength: 0.35,
      gaugeLength: 1.2,
      gripRadius: 0.45,
      gaugeRadius: 0.22,
    }
    const stretchMax = 0.35
    const transitionStretchMax = 0.12
    const breakGapMax = base.gaugeLength * 0.45
    const maxLength =
      base.gripLength * 2 +
      base.transitionLength * (1 + transitionStretchMax) * 2 +
      base.gaugeLength * (1 + stretchMax) +
      breakGapMax
    const maxDiameter = base.gripRadius * 2

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xb9bcc2,
      roughness: 0.35,
      metalness: 0.2,
    })
    const gripMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.45,
      metalness: 0.25,
    })
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.4,
      metalness: 0.1,
    })

    const gripGeometry = new THREE.CylinderGeometry(base.gripRadius, base.gripRadius, base.gripLength, 36)
    const transitionGeometry = new THREE.CylinderGeometry(
      base.gripRadius,
      base.gaugeRadius,
      base.transitionLength,
      36
    )
    const transitionGeometryBottom = new THREE.CylinderGeometry(
      base.gaugeRadius,
      base.gripRadius,
      base.transitionLength,
      36
    )
    const gaugeTopGeometry = new THREE.CylinderGeometry(
      base.gaugeRadius,
      base.gaugeRadius,
      base.gaugeLength / 2,
      36
    )
    const gaugeBottomGeometry = new THREE.CylinderGeometry(
      base.gaugeRadius,
      base.gaugeRadius,
      base.gaugeLength / 2,
      36
    )
    const gaugeRingGeometry = new THREE.TorusGeometry(base.gaugeRadius * 1.05, 0.03, 12, 48)

    const topGrip = new THREE.Mesh(gripGeometry, gripMaterial)
    const bottomGrip = new THREE.Mesh(gripGeometry, gripMaterial)
    const topTransition = new THREE.Mesh(transitionGeometry, bodyMaterial)
    const bottomTransition = new THREE.Mesh(transitionGeometryBottom, bodyMaterial)
    const gaugeTop = new THREE.Mesh(gaugeTopGeometry, bodyMaterial)
    const gaugeBottom = new THREE.Mesh(gaugeBottomGeometry, bodyMaterial)
    const gaugeRing = new THREE.Mesh(gaugeRingGeometry, ringMaterial)
    gaugeRing.rotation.x = Math.PI / 2

    specimenGroup.add(
      topGrip,
      topTransition,
      gaugeTop,
      gaugeBottom,
      bottomTransition,
      bottomGrip,
      gaugeRing
    )

    const updateSpecimen = () => {
      const progressValue = clamp(progressRef.current, 0, 1)
      const stretch = 1 + stretchMax * easeInOutCubic(progressValue)
      const transitionStretch = 1 + transitionStretchMax * easeInOutCubic(progressValue)
      const neckingRaw = Math.max(0, (progressValue - 0.45) / 0.55)
      const necking = easeInOutCubic(neckingRaw)
      const breakProgressRaw = Math.max(0, (progressValue - BREAK_START) / (1 - BREAK_START))
      const breakProgress = easeInOutCubic(breakProgressRaw)
      const breakGap = breakGapMax * breakProgress
      const gaugeRadiusScale = Math.max(0.22, 1 - 0.35 * necking - 0.1 * breakProgress)
      const transitionRadiusScale = Math.max(0.35, 1 - 0.18 * necking - 0.06 * breakProgress)
      const gaugeStretch = stretch * (1 - 0.08 * breakProgress)

      gaugeTop.scale.set(gaugeRadiusScale, gaugeStretch, gaugeRadiusScale)
      gaugeBottom.scale.set(gaugeRadiusScale, gaugeStretch, gaugeRadiusScale)
      topTransition.scale.set(transitionRadiusScale, transitionStretch, transitionRadiusScale)
      bottomTransition.scale.set(transitionRadiusScale, transitionStretch, transitionRadiusScale)

      const gaugeHalfLength = (base.gaugeLength * gaugeStretch) / 2
      const transitionLength = base.transitionLength * transitionStretch
      const totalLength =
        base.gripLength * 2 + transitionLength * 2 + gaugeHalfLength * 2 + breakGap

      let cursor = totalLength / 2
      topGrip.position.y = cursor - base.gripLength / 2
      cursor -= base.gripLength
      topTransition.position.y = cursor - transitionLength / 2
      cursor -= transitionLength
      gaugeTop.position.y = cursor - gaugeHalfLength / 2
      cursor -= gaugeHalfLength
      cursor -= breakGap
      gaugeBottom.position.y = cursor - gaugeHalfLength / 2
      cursor -= gaugeHalfLength
      bottomTransition.position.y = cursor - transitionLength / 2
      cursor -= transitionLength
      bottomGrip.position.y = cursor - base.gripLength / 2

      gaugeRing.scale.set(gaugeRadiusScale, gaugeRadiusScale, 1)
      gaugeRing.position.y = gaugeTop.position.y
      gaugeRing.visible = breakProgress < 0.5
    }

    const rotationTarget = { x: 0, y: 0 }
    const rotationCurrent = { x: 0, y: 0 }
    const pointer = { active: false, x: 0, y: 0 }

    const handlePointerDown = (event: PointerEvent) => {
      pointer.active = true
      pointer.x = event.clientX
      pointer.y = event.clientY
      renderer.domElement.setPointerCapture(event.pointerId)
      renderer.domElement.style.cursor = 'grabbing'
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointer.active) return
      const dx = event.clientX - pointer.x
      const dy = event.clientY - pointer.y
      rotationTarget.y += dx * 0.005
      rotationTarget.x += dy * 0.005
      pointer.x = event.clientX
      pointer.y = event.clientY
    }

    const handlePointerUp = (event: PointerEvent) => {
      pointer.active = false
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId)
      }
      renderer.domElement.style.cursor = 'grab'
    }

    let minZoom = 4.5
    let maxZoom = 12

    const fitCameraToSpecimen = () => {
      const verticalFov = THREE.MathUtils.degToRad(camera.fov)
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect)
      const limitingFov = Math.min(verticalFov, horizontalFov)
      const radius = Math.sqrt((maxLength / 2) ** 2 + (maxDiameter / 2) ** 2)
      const distance = (radius / Math.sin(limitingFov / 2)) * 1.45
      camera.position.set(0, 0, distance)
      camera.lookAt(0, 0, 0)
      minZoom = distance * 0.8
      maxZoom = distance * 3.2
    }

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const nextZ = clamp(camera.position.z + event.deltaY * 0.002, minZoom, maxZoom)
      camera.position.z = nextZ
    }

    renderer.domElement.style.cursor = 'grab'
    renderer.domElement.style.touchAction = 'none'
    renderer.domElement.addEventListener('pointerdown', handlePointerDown)
    renderer.domElement.addEventListener('pointermove', handlePointerMove)
    renderer.domElement.addEventListener('pointerup', handlePointerUp)
    renderer.domElement.addEventListener('pointerleave', handlePointerUp)
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false })

    const handleResize = () => {
      const { width, height } = container.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      fitCameraToSpecimen()
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)
    handleResize()

    let frameId = 0
    const animate = (time: number) => {
      updateSpecimen()
      rotationCurrent.x += (rotationTarget.x - rotationCurrent.x) * 0.08
      rotationCurrent.y += (rotationTarget.y - rotationCurrent.y) * 0.08
      specimenGroup.rotation.x = -0.15 + rotationCurrent.x
      specimenGroup.rotation.y = time * 0.00035 + rotationCurrent.y
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }

    frameId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      renderer.domElement.removeEventListener('pointermove', handlePointerMove)
      renderer.domElement.removeEventListener('pointerup', handlePointerUp)
      renderer.domElement.removeEventListener('pointerleave', handlePointerUp)
      renderer.domElement.removeEventListener('wheel', handleWheel)
      renderer.dispose()
      gripGeometry.dispose()
      transitionGeometry.dispose()
      transitionGeometryBottom.dispose()
      gaugeTopGeometry.dispose()
      gaugeBottomGeometry.dispose()
      gaugeRingGeometry.dispose()
      bodyMaterial.dispose()
      gripMaterial.dispose()
      ringMaterial.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-muted/40 via-background to-muted/30"
    />
  )
}

export function TestLiveClient() {
  const curve = useMemo(
    () => generateStressStrainCurve(RAMBERG_PARAMS, MAX_STRAIN, CURVE_POINTS),
    []
  )
  const maxStress = useMemo(
    () => curve.reduce((acc, point) => Math.max(acc, point.stress), 0),
    [curve]
  )

  const [status, setStatus] = useState<SimulationStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const startRef = useRef(0)

  const handleStart = () => {
    startRef.current = performance.now()
    setElapsedMs(0)
    setProgress(0)
    setStatus('running')
  }

  useEffect(() => {
    if (status !== 'running') return

    let frameId = 0
    const tick = (now: number) => {
      const elapsed = now - startRef.current
      const nextProgress = clamp(elapsed / SIMULATION_DURATION_MS, 0, 1)
      setProgress(nextProgress)
      setElapsedMs(Math.min(elapsed, SIMULATION_DURATION_MS))

      if (nextProgress >= 1) {
        setStatus('finished')
        return
      }

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [status])

  const currentPoint = useMemo(() => getPointAtProgress(curve, progress), [curve, progress])
  const jitter = status === 'running' ? 1 + 0.018 * Math.sin(elapsedMs / 180) + 0.012 * Math.sin(elapsedMs / 60) : 1
  const strainJitter = status === 'running' ? 1 + 0.01 * Math.sin(elapsedMs / 140 + 0.4) : 1
  const stressReading = Math.max(0, currentPoint.stress * jitter)
  const strainReading = Math.max(0, currentPoint.strain * strainJitter)
  const stressGauge = maxStress ? clamp(stressReading / maxStress, 0, 1) : 0
  const strainGauge = clamp(strainReading / MAX_STRAIN, 0, 1)
  const elapsedSeconds = elapsedMs / 1000
  const durationSeconds = SIMULATION_DURATION_MS / 1000
  const statusStyles = statusConfig[status]
  const breakReached = progress >= BREAK_START
  const isLive = status !== 'idle'
  const eventTimeline = useMemo(() => {
    const events = [
      { label: 'Inicio do ensaio', at: 0 },
      { label: 'Escoamento inicial', at: 0.22 },
      { label: 'Estricamento', at: 0.45 },
      { label: 'Rompimento', at: BREAK_START },
    ]

    return events.map((event, index) => {
      const nextAt = events[index + 1]?.at ?? 1.01
      const isActive = isLive && progress >= event.at && progress < nextAt
      const isComplete = isLive && progress >= nextAt
      return { ...event, isActive, isComplete }
    })
  }, [progress, isLive])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={statusStyles.className}>
              <span className={`mr-1 inline-flex size-2 rounded-full ${statusStyles.dot}`} />
              {statusStyles.label}
            </Badge>
            <Badge variant="outline" className="gap-2 border-border/70 text-muted-foreground">
              <Activity className="size-3" /> Tempo real
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Acompanhe a curva Ramberg-Osgood sendo tracada enquanto o corpo de prova se estira.
          </p>
          <p className="text-xs text-muted-foreground">
            Tempo: {elapsedSeconds.toFixed(1)}s / {durationSeconds.toFixed(0)}s
          </p>
        </div>
        <Button onClick={handleStart} className="gap-2 shadow-sm">
          {status === 'running' ? <RotateCcw className="size-4" /> : <Play className="size-4" />}
          Iniciar Ensaio
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-6">
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle>Curva Ramberg-Osgood (tempo real)</CardTitle>
              <CardDescription>
                A linha nasce do zero e acompanha a trajetoria prevista do material.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LiveStressStrainChart
                curve={curve}
                progress={progress}
                maxStrain={MAX_STRAIN}
                maxStress={maxStress}
                currentPoint={currentPoint}
              />
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle>Grafico Tensao x Deformacao (curva completa)</CardTitle>
              <CardDescription>
                Visualizacao completa da curva prevista para referencia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StressStrainChart curve={curve} interactive={false} />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <SensorGauge
              label="Tensao Atual"
              value={stressReading}
              unit="MPa"
              progress={stressGauge}
              hint="Oscilacao simulada de sensores de carga."
            />
            <SensorGauge
              label="Deformacao Atual"
              value={strainReading * 100}
              unit="%"
              progress={strainGauge}
              hint="Leitura instantanea do extensometro virtual."
            />
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle>Corpo de Prova ASTM D638</CardTitle>
              <CardDescription>
                Arraste para rotacionar e use o scroll para aproximar. O estricamento acompanha o
                ensaio. Padrao ASTM D638 Tipo I.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SpecimenScene progress={progress} />
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle>Indicadores do corpo de prova</CardTitle>
              <CardDescription>Leituras sincronizadas ao alongamento do ensaio.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <MetricTile
                  label="Alongamento"
                  value={`${(progress * 100).toFixed(1)}%`}
                  detail="Evolucao total durante o ensaio."
                />
                <MetricTile
                  label="Estricamento"
                  value={`${(Math.max(0, (progress - 0.45) / 0.55) * 100).toFixed(0)}%`}
                  detail="Reducao localizada na zona de ruptura."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle>Parametros do ensaio</CardTitle>
              <CardDescription>Configuracao usada para a curva Ramberg-Osgood.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    label: 'Modulo elastico (E)',
                    value: `${RAMBERG_PARAMS.E} MPa`,
                    detail: 'Rigidez inicial do material.',
                  },
                  {
                    label: 'Limite de escoamento (sigma_0)',
                    value: `${RAMBERG_PARAMS.sigma_0} MPa`,
                    detail: 'Inicio do comportamento plastico.',
                  },
                  {
                    label: 'Expoente de encruamento (n)',
                    value: `${RAMBERG_PARAMS.n}`,
                    detail: 'Curvatura da resposta nao linear.',
                  },
                  {
                    label: 'Deformacao maxima',
                    value: `${(MAX_STRAIN * 100).toFixed(0)}%`,
                    detail: 'Intervalo simulado do ensaio.',
                  },
                  {
                    label: 'Duracao simulada',
                    value: `${durationSeconds.toFixed(0)} s`,
                    detail: 'Tempo total do teste.',
                  },
                  {
                    label: 'Rompimento previsto',
                    value: `${(BREAK_START * 100).toFixed(0)}%`,
                    detail: 'Marco de separacao do corpo.',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-border/80 bg-card p-4 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{item.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle>Eventos do ensaio</CardTitle>
              <CardDescription>
                {breakReached
                  ? 'Rompimento detectado na simulacao.'
                  : 'Acompanhe os marcos principais do ensaio.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eventTimeline.map((event) => (
                  <div
                    key={event.label}
                    className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/40 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex size-2 rounded-full ${
                          event.isComplete
                            ? 'bg-foreground'
                            : event.isActive
                              ? 'bg-foreground/70'
                              : 'bg-muted-foreground/40'
                        }`}
                      />
                      <p className="text-sm font-medium text-foreground">{event.label}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {(event.at * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
