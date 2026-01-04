'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Play, RotateCcw } from 'lucide-react'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { calculateStrain, generateStressStrainCurve } from '@/lib/ramberg-osgood'
import type { RambergOsgoodParams } from '@/types'

const SIMULATION_DURATION_MS = 14000
const ELEMENT_COUNT = 12
const BAR_LENGTH = 120
const BASE_AREA = 110
const MAX_STRAIN = 0.22
const DEFORMATION_SCALE = 5.5
const LOAD_STEPS = 40

const RAMBERG_PARAMS: RambergOsgoodParams = {
  E: 1200,
  sigma_0: 32,
  n: 6,
}

type SimulationStatus = 'idle' | 'running' | 'finished'
type MaterialModel = 'linear' | 'nonlinear'

type ElementBase = {
  index: number
  length: number
  area: number
  areaScale: number
}

type ElementState = ElementBase & {
  stress: number
  strain: number
  displacementStart: number
  displacementEnd: number
}

type BarResponse = {
  elements: ElementState[]
  nodeDisplacements: number[]
  totalDisplacement: number
  maxStress: number
  maxStrain: number
  minStress: number
}

type ForceDisplacementPoint = {
  load: number
  linear: number
  nonlinear: number
}

type MaterialCurvePoint = {
  strain: number
  linear: number
  nonlinear: number
}

const statusConfig: Record<SimulationStatus, { label: string; className: string; dot: string }> = {
  idle: {
    label: 'Aguardando',
    className: 'border-border/60 bg-muted/40 text-muted-foreground',
    dot: 'bg-muted-foreground/60',
  },
  running: {
    label: 'Em analise',
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

const loadFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const displacementFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const stressFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const strainFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max)

const formatSigned = (value: number, formatter: Intl.NumberFormat) => {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatter.format(value)}`
}

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
}

function buildElements(count: number, length: number, baseArea: number): ElementBase[] {
  const elementLength = length / count
  return Array.from({ length: count }, (_, index) => {
    const t = (index + 0.5) / count
    const distance = Math.abs(t - 0.5) / 0.5
    const reduction = 0.38 * Math.exp(-Math.pow(distance / 0.7, 2))
    const area = baseArea * (1 - reduction)
    const areaScale = Math.sqrt(area / baseArea)
    return {
      index,
      length: elementLength,
      area,
      areaScale,
    }
  })
}

function solveBarResponse(
  load: number,
  model: MaterialModel,
  params: RambergOsgoodParams,
  elements: ElementBase[]
): BarResponse {
  let displacement = 0
  let maxStress = 0
  let maxStrain = 0
  let minStress = Number.POSITIVE_INFINITY
  const nodeDisplacements: number[] = [0]

  const elementStates = elements.map((element) => {
    const stress = load > 0 ? load / element.area : 0
    const strain = model === 'linear' ? stress / params.E : calculateStrain(stress, params)
    const displacementStart = displacement
    displacement += strain * element.length
    const displacementEnd = displacement
    maxStress = Math.max(maxStress, stress)
    maxStrain = Math.max(maxStrain, strain)
    minStress = Math.min(minStress, stress)
    nodeDisplacements.push(displacement)

    return {
      ...element,
      stress,
      strain,
      displacementStart,
      displacementEnd,
    }
  })

  return {
    elements: elementStates,
    nodeDisplacements,
    totalDisplacement: displacement,
    maxStress,
    maxStrain,
    minStress: Number.isFinite(minStress) ? minStress : 0,
  }
}

type FemSceneProps = {
  elements: ElementState[]
  nodeDisplacements: number[]
  minStress: number
  maxStress: number
  deformationScale: number
  criticalIndex: number
}

function FemScene({
  elements,
  nodeDisplacements,
  minStress,
  maxStress,
  deformationScale,
  criticalIndex,
}: FemSceneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dataRef = useRef({
    elements,
    nodeDisplacements,
    minStress,
    maxStress,
    criticalIndex,
  })

  useEffect(() => {
    dataRef.current = { elements, nodeDisplacements, minStress, maxStress, criticalIndex }
  }, [elements, nodeDisplacements, minStress, maxStress, criticalIndex])

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

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(2.2, 1.6, 6.6)

    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1)
    keyLight.position.set(4, 5, 3)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.55)
    fillLight.position.set(-3, 2, -4)
    scene.add(ambient, keyLight, fillLight)

    const barGroup = new THREE.Group()
    scene.add(barGroup)

    const elementLength = 4.4 / ELEMENT_COUNT
    const baseWidth = 0.9
    const baseDepth = 0.6
    const baseGeometry = new THREE.BoxGeometry(baseWidth, elementLength, baseDepth)
    const edgeGeometry = new THREE.EdgesGeometry(baseGeometry)
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x1f2937,
      transparent: true,
      opacity: 0.45,
    })

    const elementGroups = Array.from({ length: ELEMENT_COUNT }, () => {
      const material = new THREE.MeshStandardMaterial({
        color: 0x9ca3af,
        roughness: 0.35,
        metalness: 0.12,
      })
      const mesh = new THREE.Mesh(baseGeometry, material)
      const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial)
      const group = new THREE.Group()
      group.add(mesh)
      group.add(edges)
      barGroup.add(group)
      return { group, material }
    })

    const nodeGeometry = new THREE.SphereGeometry(0.06, 18, 18)
    const nodeMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
      metalness: 0.1,
    })
    const nodeMeshes = Array.from({ length: ELEMENT_COUNT + 1 }, () => {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial)
      barGroup.add(node)
      return node
    })

    const supportGeometry = new THREE.BoxGeometry(baseWidth * 1.1, 0.22, baseDepth * 1.1)
    const supportMaterial = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.55,
      metalness: 0.1,
    })
    const supportMesh = new THREE.Mesh(supportGeometry, supportMaterial)
    barGroup.add(supportMesh)

    const arrowMaterial = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.4,
      metalness: 0.2,
    })
    const arrowGroup = new THREE.Group()
    const arrowShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.5, 18),
      arrowMaterial
    )
    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.26, 18), arrowMaterial)
    arrowHead.position.y = 0.38
    arrowGroup.add(arrowShaft, arrowHead)
    barGroup.add(arrowGroup)

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
      rotationTarget.y += dx * 0.004
      rotationTarget.x += dy * 0.004
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

    let minZoom = 5.5
    let maxZoom = 12

    const fitCamera = () => {
      const verticalFov = THREE.MathUtils.degToRad(camera.fov)
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect)
      const limitingFov = Math.min(verticalFov, horizontalFov)
      const length = 4.4 * 1.45
      const width = baseWidth * 1.4
      const radius = Math.sqrt((length / 2) ** 2 + (width / 2) ** 2)
      const distance = (radius / Math.sin(limitingFov / 2)) * 1.25
      camera.position.set(0, 1.2, distance)
      camera.lookAt(0, 0, 0)
      minZoom = distance * 0.75
      maxZoom = distance * 3
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
      fitCamera()
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)
    handleResize()

    const color = new THREE.Color()

    const updateScene = () => {
      const {
        elements: currentElements,
        nodeDisplacements: currentNodes,
        minStress: currentMin,
        maxStress: currentMax,
        criticalIndex: currentCritical,
      } = dataRef.current

      const elementCount = currentElements.length || ELEMENT_COUNT
      const length = 4.4
      const elementBaseLength = length / elementCount
      const baseStart = -length / 2
      const displacementScale = (length / BAR_LENGTH) * deformationScale
      const stressRange = currentMax - currentMin || 1

      currentElements.forEach((element, index) => {
        const start =
          baseStart + index * elementBaseLength + (currentNodes[index] ?? 0) * displacementScale
        const end =
          baseStart +
          (index + 1) * elementBaseLength +
          (currentNodes[index + 1] ?? 0) * displacementScale
        const lengthScale = Math.max(0.2, (end - start) / elementBaseLength)
        const { group, material } = elementGroups[index]
        group.scale.set(element.areaScale, lengthScale, element.areaScale)
        group.position.set(0, (start + end) / 2, 0)
        const stressRatio = clamp((element.stress - currentMin) / stressRange)
        color.setHSL(0.62 - 0.62 * stressRatio, 0.65, 0.52)
        material.color.copy(color)
        if (index === currentCritical) {
          material.emissive.setRGB(0.15, 0.05, 0)
          material.emissiveIntensity = 0.55
        } else {
          material.emissive.setRGB(0, 0, 0)
          material.emissiveIntensity = 0
        }
      })

      nodeMeshes.forEach((node, index) => {
        const position =
          baseStart + index * elementBaseLength + (currentNodes[index] ?? 0) * displacementScale
        node.position.set(0, position, 0)
      })

      supportMesh.position.set(0, baseStart - 0.2, 0)
      const lastNode =
        baseStart +
        elementCount * elementBaseLength +
        (currentNodes[elementCount] ?? 0) * displacementScale
      arrowGroup.position.set(0, lastNode + 0.55, 0)
    }

    let frameId = 0
    const animate = (time: number) => {
      updateScene()
      rotationCurrent.x += (rotationTarget.x - rotationCurrent.x) * 0.08
      rotationCurrent.y += (rotationTarget.y - rotationCurrent.y) * 0.08
      barGroup.rotation.x = -0.2 + rotationCurrent.x
      barGroup.rotation.y = time * 0.00035 + rotationCurrent.y
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
      baseGeometry.dispose()
      edgeGeometry.dispose()
      nodeGeometry.dispose()
      supportGeometry.dispose()
      arrowShaft.geometry.dispose()
      arrowHead.geometry.dispose()
      edgeMaterial.dispose()
      nodeMaterial.dispose()
      supportMaterial.dispose()
      arrowMaterial.dispose()
      elementGroups.forEach(({ material }) => material.dispose())
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement)
      }
    }
  }, [deformationScale])

  return (
    <div
      ref={containerRef}
      className="relative flex h-80 w-full items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-muted/40 via-background to-muted/30"
    />
  )
}

type SummaryTileProps = {
  label: string
  value: string
  detail?: string
}

function SummaryTile({ label, value, detail }: SummaryTileProps) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">{value}</p>
      {detail ? <p className="text-[11px] text-muted-foreground">{detail}</p> : null}
    </div>
  )
}

type ForceDisplacementChartProps = {
  data: ForceDisplacementPoint[]
  currentLoad: number
  currentLinear: number
  currentNonlinear: number
}

function ForceDisplacementChart({
  data,
  currentLoad,
  currentLinear,
  currentNonlinear,
}: ForceDisplacementChartProps) {
  return (
    <ChartContainer
      config={{
        nonlinear: {
          label: 'Nao linear',
          color: 'var(--chart-1)',
        },
        linear: {
          label: 'Linear',
          color: 'var(--chart-2)',
        },
      }}
      className="h-72 w-full aspect-auto"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            type="number"
            dataKey="load"
            tickFormatter={(value) => loadFormatter.format(value)}
            className="text-xs"
            name="Carga"
          />
          <YAxis
            tickFormatter={(value) => displacementFormatter.format(value)}
            className="text-xs"
            name="Deslocamento"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(label) => `Carga ${loadFormatter.format(Number(label))} N`}
                formatter={(value, name) => {
                  const label = name === 'linear' ? 'Linear' : 'Nao linear'
                  return (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-semibold">
                        {displacementFormatter.format(Number(value))} mm
                      </span>
                    </div>
                  )
                }}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="nonlinear"
            stroke="var(--color-nonlinear)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="linear"
            stroke="var(--color-linear)"
            strokeWidth={2}
            dot={false}
            strokeDasharray="4 3"
          />
          <ReferenceDot
            x={currentLoad}
            y={currentNonlinear}
            r={4}
            fill="var(--color-nonlinear)"
            stroke="var(--color-nonlinear)"
          />
          <ReferenceDot
            x={currentLoad}
            y={currentLinear}
            r={4}
            fill="var(--color-linear)"
            stroke="var(--color-linear)"
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

type MaterialCurveChartProps = {
  data: MaterialCurvePoint[]
  highlightStrain: number
  highlightStress: number
  model: MaterialModel
}

function MaterialCurveChart({
  data,
  highlightStrain,
  highlightStress,
  model,
}: MaterialCurveChartProps) {
  return (
    <ChartContainer
      config={{
        nonlinear: {
          label: 'Ramberg-Osgood',
          color: 'var(--chart-1)',
        },
        linear: {
          label: 'Hooke',
          color: 'var(--chart-3)',
        },
      }}
      className="h-72 w-full aspect-auto"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            type="number"
            dataKey="strain"
            tickFormatter={(value) => strainFormatter.format(value)}
            className="text-xs"
            name="Deformacao"
          />
          <YAxis
            tickFormatter={(value) => stressFormatter.format(value)}
            className="text-xs"
            name="Tensao"
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(label) => `Deformacao ${strainFormatter.format(Number(label))}`}
                formatter={(value, name) => {
                  const label = name === 'linear' ? 'Hooke' : 'Ramberg-Osgood'
                  return (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-semibold">
                        {stressFormatter.format(Number(value))} MPa
                      </span>
                    </div>
                  )
                }}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="nonlinear"
            stroke="var(--color-nonlinear)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="linear"
            stroke="var(--color-linear)"
            strokeWidth={2}
            dot={false}
            strokeDasharray="4 3"
          />
          <ReferenceDot
            x={highlightStrain}
            y={highlightStress}
            r={4}
            fill={model === 'linear' ? 'var(--color-linear)' : 'var(--color-nonlinear)'}
            stroke={model === 'linear' ? 'var(--color-linear)' : 'var(--color-nonlinear)'}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export function MefRambergClient() {
  const [status, setStatus] = useState<SimulationStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [materialModel, setMaterialModel] = useState<MaterialModel>('nonlinear')
  const startRef = useRef(0)

  const elementsBase = useMemo(() => buildElements(ELEMENT_COUNT, BAR_LENGTH, BASE_AREA), [])
  const minArea = useMemo(
    () => elementsBase.reduce((min, element) => Math.min(min, element.area), BASE_AREA),
    [elementsBase]
  )
  const maxLoad = useMemo(() => minArea * RAMBERG_PARAMS.sigma_0 * 1.35, [minArea])

  const handleStart = () => {
    startRef.current = performance.now()
    setElapsedMs(0)
    setProgress(0)
    setStatus('running')
  }

  const handleManualProgress = (value: number) => {
    const clamped = clamp(value, 0, 1)
    setProgress(clamped)
    setElapsedMs(clamped * SIMULATION_DURATION_MS)
    setStatus(clamped >= 1 ? 'finished' : 'idle')
  }

  useEffect(() => {
    if (status !== 'running') return

    let frameId = 0
    const tick = (now: number) => {
      const elapsed = now - startRef.current
      const ratio = clamp(elapsed / SIMULATION_DURATION_MS, 0, 1)
      const eased = easeInOutCubic(ratio)
      setProgress(eased)
      setElapsedMs(Math.min(elapsed, SIMULATION_DURATION_MS))

      if (ratio >= 1) {
        setStatus('finished')
        return
      }

      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [status])

  const currentLoad = progress * maxLoad
  const currentResponse = useMemo(
    () => solveBarResponse(currentLoad, materialModel, RAMBERG_PARAMS, elementsBase),
    [currentLoad, materialModel, elementsBase]
  )
  const linearResponse = useMemo(
    () => solveBarResponse(currentLoad, 'linear', RAMBERG_PARAMS, elementsBase),
    [currentLoad, elementsBase]
  )
  const nonlinearResponse = useMemo(
    () => solveBarResponse(currentLoad, 'nonlinear', RAMBERG_PARAMS, elementsBase),
    [currentLoad, elementsBase]
  )
  const criticalIndex = useMemo(() => {
    if (!currentResponse.elements.length) return 0
    return currentResponse.elements.reduce((acc, element, index, array) => {
      return element.stress > array[acc].stress ? index : acc
    }, 0)
  }, [currentResponse.elements])

  const forceDisplacementData = useMemo<ForceDisplacementPoint[]>(() => {
    return Array.from({ length: LOAD_STEPS + 1 }, (_, index) => {
      const ratio = index / LOAD_STEPS
      const load = ratio * maxLoad
      const linear = solveBarResponse(load, 'linear', RAMBERG_PARAMS, elementsBase)
      const nonlinear = solveBarResponse(load, 'nonlinear', RAMBERG_PARAMS, elementsBase)
      return {
        load,
        linear: linear.totalDisplacement,
        nonlinear: nonlinear.totalDisplacement,
      }
    })
  }, [elementsBase, maxLoad])

  const materialCurve = useMemo(() => {
    const curve = generateStressStrainCurve(RAMBERG_PARAMS, MAX_STRAIN, 120)
    return curve.map((point) => ({
      strain: point.strain,
      nonlinear: point.stress,
      linear: point.strain * RAMBERG_PARAMS.E,
    }))
  }, [])

  const criticalElement = currentResponse.elements[criticalIndex]
  const displacementDelta = nonlinearResponse.totalDisplacement - linearResponse.totalDisplacement
  const displacementDeltaPercent =
    linearResponse.totalDisplacement > 0
      ? (displacementDelta / linearResponse.totalDisplacement) * 100
      : 0
  const currentStiffness =
    currentResponse.totalDisplacement > 0 ? currentLoad / currentResponse.totalDisplacement : 0
  const signedDisplacementDelta = formatSigned(displacementDelta, displacementFormatter)
  const signedDisplacementDeltaPercent = formatSigned(displacementDeltaPercent, percentFormatter)
  const statusStyles = statusConfig[status]
  const elapsedSeconds = elapsedMs / 1000
  const durationSeconds = SIMULATION_DURATION_MS / 1000
  const loadRatio = progress * 100

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={statusStyles.className}>
                <span className={`mr-1 inline-flex size-2 rounded-full ${statusStyles.dot}`} />
                {statusStyles.label}
              </Badge>
              <Badge variant="outline" className="border-border/70 text-muted-foreground">
                MEF 1D
              </Badge>
              <Badge variant="outline" className="border-border/70 text-muted-foreground">
                Ramberg-Osgood
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              A barra e discretizada em elementos finitos para ligar a curva constitutiva a resposta
              estrutural global.
            </p>
            <p className="text-xs text-muted-foreground">
              Tempo: {elapsedSeconds.toFixed(1)}s / {durationSeconds.toFixed(0)}s
            </p>
          </div>
          <Button onClick={handleStart} className="gap-2 shadow-sm">
            {status === 'running' ? <RotateCcw className="size-4" /> : <Play className="size-4" />}
            {status === 'running' ? 'Reiniciar analise' : 'Iniciar analise'}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Etapa de carga
            </p>
            <p className="text-sm text-muted-foreground">
              Carga aplicada: {loadFormatter.format(currentLoad)} N ({loadRatio.toFixed(0)}%)
            </p>
            <p className="text-xs text-muted-foreground">
              Deformacao visual amplificada em {DEFORMATION_SCALE}x para leitura.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Controle manual
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={loadRatio}
              onChange={(event) => handleManualProgress(Number(event.target.value) / 100)}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-foreground"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle>Malha MEF e campo de tensoes</CardTitle>
            <CardDescription>
              Veja a malha, o carregamento e o campo de tensao no mesmo quadro. Arraste para
              rotacionar e use o scroll para aproximar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="relative">
                <FemScene
                  elements={currentResponse.elements}
                  nodeDisplacements={currentResponse.nodeDisplacements}
                  minStress={currentResponse.minStress}
                  maxStress={currentResponse.maxStress}
                  deformationScale={DEFORMATION_SCALE}
                  criticalIndex={criticalIndex}
                />
                <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-border/60 bg-background/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground shadow-sm">
                  Carga aplicada
                </div>
                <div className="pointer-events-none absolute left-3 bottom-3 rounded-full border border-border/60 bg-background/80 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground shadow-sm">
                  Engaste fixo
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Como ler
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li>Malha com {ELEMENT_COUNT} elementos e secao reduzida no centro.</li>
                    <li>Base fixa; carga aplicada no topo da barra.</li>
                    <li>Cores indicam tensao local e o elemento critico acende.</li>
                  </ul>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryTile
                    label="Tensao maxima"
                    value={`${stressFormatter.format(currentResponse.maxStress)} MPa`}
                    detail={
                      criticalElement
                        ? `Elemento ${criticalIndex + 1} - Area ${criticalElement.area.toFixed(0)} mm2`
                        : undefined
                    }
                  />
                  <SummaryTile
                    label="Deformacao maxima"
                    value={`${strainFormatter.format(currentResponse.maxStrain)} mm/mm`}
                    detail="Zona central da barra."
                  />
                  <SummaryTile
                    label="Deslocamento total"
                    value={`${displacementFormatter.format(currentResponse.totalDisplacement)} mm`}
                    detail={`Carga ${loadFormatter.format(currentLoad)} N`}
                  />
                  <SummaryTile
                    label="Rigidez aparente"
                    value={`${displacementFormatter.format(currentStiffness)} N/mm`}
                    detail="K = F / u"
                  />
                </div>
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Baixa tensao</span>
                    <span className="mx-3 h-2 flex-1 rounded-full bg-gradient-to-r from-sky-500 via-emerald-400 to-orange-500" />
                    <span>Alta tensao</span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Deformacao visual amplificada em {DEFORMATION_SCALE}x para leitura.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle>Modelo constitutivo</CardTitle>
            <CardDescription>
              Alterne entre linear e nao linear para ver o impacto na resposta global.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs
              value={materialModel}
              onValueChange={(value) => setMaterialModel(value as MaterialModel)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nonlinear">Ramberg-Osgood</TabsTrigger>
                <TabsTrigger value="linear">Linear</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: 'Modulo elastico (E)',
                  value: `${RAMBERG_PARAMS.E} MPa`,
                  detail: 'Rigidez inicial do material.',
                },
                {
                  label: 'Limite de escoamento (\u03c3\u2080)',
                  value: `${RAMBERG_PARAMS.sigma_0} MPa`,
                  detail: 'Referencia para plasticidade.',
                },
                {
                  label: 'Expoente de encruamento (n)',
                  value: `${RAMBERG_PARAMS.n}`,
                  detail: 'Curvatura nao linear.',
                },
                {
                  label: 'Elementos na malha',
                  value: `${ELEMENT_COUNT}`,
                  detail: 'Discretizacao ao longo da barra.',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-border/70 bg-muted/30 px-3 py-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{item.value}</p>
                  <p className="text-[11px] text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Comparativo rapido
              </p>
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Deslocamento linear</span>
                  <span className="font-mono font-semibold text-foreground">
                    {displacementFormatter.format(linearResponse.totalDisplacement)} mm
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Deslocamento nao linear</span>
                  <span className="font-mono font-semibold text-foreground">
                    {displacementFormatter.format(nonlinearResponse.totalDisplacement)} mm
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Diferenca</span>
                  <span className="font-mono font-semibold text-foreground">
                    {signedDisplacementDelta} mm ({signedDisplacementDeltaPercent}%)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="curvas" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="curvas">Curvas</TabsTrigger>
          <TabsTrigger value="elementos">Elementos</TabsTrigger>
        </TabsList>
        <TabsContent value="curvas">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/70">
              <CardHeader className="pb-3">
                <CardTitle>Curva carga x deslocamento</CardTitle>
                <CardDescription>
                  Linha continua: nao linear. Linha tracejada: linear.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ForceDisplacementChart
                  data={forceDisplacementData}
                  currentLoad={currentLoad}
                  currentLinear={linearResponse.totalDisplacement}
                  currentNonlinear={nonlinearResponse.totalDisplacement}
                />
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader className="pb-3">
                <CardTitle>Curva tensao x deformacao</CardTitle>
                <CardDescription>O ponto marca o valor atual de tensao maxima.</CardDescription>
              </CardHeader>
              <CardContent>
                <MaterialCurveChart
                  data={materialCurve}
                  highlightStrain={currentResponse.maxStrain}
                  highlightStress={currentResponse.maxStress}
                  model={materialModel}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="elementos">
          <Card className="border-border/70">
            <CardHeader className="pb-3">
              <CardTitle>Detalhamento dos elementos</CardTitle>
              <CardDescription>
                Tensao, deformacao e area por elemento da malha (critico destacado).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {currentResponse.elements.map((element) => {
                  const ratio = currentResponse.maxStress
                    ? clamp(element.stress / currentResponse.maxStress)
                    : 0
                  const isCritical = element.index === criticalIndex
                  return (
                    <div
                      key={element.index}
                      className={`rounded-lg border px-3 py-3 ${
                        isCritical
                          ? 'border-amber-300/60 bg-amber-50/60 dark:border-amber-400/30 dark:bg-amber-500/10'
                          : 'border-border/70 bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Elemento {element.index + 1}
                        </p>
                        <span className="text-[11px] text-muted-foreground">
                          Area {element.area.toFixed(0)} mm2
                        </span>
                      </div>
                      <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>Tensao</span>
                          <span className="font-mono font-semibold text-foreground">
                            {stressFormatter.format(element.stress)} MPa
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Deformacao</span>
                          <span className="font-mono font-semibold text-foreground">
                            {strainFormatter.format(element.strain)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-orange-500"
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
