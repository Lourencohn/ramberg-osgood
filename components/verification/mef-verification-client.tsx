'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import type { RambergOsgoodParams } from '@/types'
import { calculateStrain } from '@/lib/ramberg-osgood'
import { useSettings } from '@/components/settings-provider'
import { convertStress, getUnitLabels } from '@/lib/units'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { Gauge, Orbit } from 'lucide-react'

const BAR_LENGTH = 120
const BASE_AREA = 110
const DEFAULT_PARAMS: RambergOsgoodParams = {
  E: 1200,
  sigma_0: 32,
  n: 6,
}
const MESH_LEVELS = [6, 10, 16, 24, 36, 52]
const LOAD_LEVELS = [2200, 3200, 4200]
const REFERENCE_MESH = 260
const MM_TO_IN = 0.0393700787

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
}

type BarResponse = {
  elements: ElementState[]
  totalDisplacement: number
  maxStress: number
  maxStrain: number
  minStress: number
}

type ConvergencePoint = {
  elements: number
  displacement: number
  error: number
  elementLength: number
}

const stressFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const displacementFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

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

  const states = elements.map((element) => {
    const stress = load > 0 ? load / element.area : 0
    const strain = model === 'linear' ? stress / params.E : calculateStrain(stress, params)
    displacement += strain * element.length
    maxStress = Math.max(maxStress, stress)
    maxStrain = Math.max(maxStrain, strain)
    minStress = Math.min(minStress, stress)
    return {
      ...element,
      stress,
      strain,
    }
  })

  return {
    elements: states,
    totalDisplacement: displacement,
    maxStress,
    maxStrain,
    minStress: Number.isFinite(minStress) ? minStress : 0,
  }
}

function buildConvergence(
  load: number,
  model: MaterialModel,
  params: RambergOsgoodParams
) {
  const referenceElements = buildElements(REFERENCE_MESH, BAR_LENGTH, BASE_AREA)
  const reference = solveBarResponse(load, model, params, referenceElements).totalDisplacement

  return {
    reference,
    points: MESH_LEVELS.map((count) => {
      const elements = buildElements(count, BAR_LENGTH, BASE_AREA)
      const response = solveBarResponse(load, model, params, elements)
      const error = reference > 0 ? Math.abs(response.totalDisplacement - reference) / reference : 0
      return {
        elements: count,
        displacement: response.totalDisplacement,
        error,
        elementLength: BAR_LENGTH / count,
      }
    }),
  }
}

function mapColor(t: number) {
  const clamped = Math.max(0, Math.min(1, t))
  const color = new THREE.Color()
  color.setHSL(0.6 - 0.55 * clamped, 0.55, 0.5)
  return color
}

function MeshScene({ elements }: { elements: ElementState[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current || !elements.length) return undefined

    const container = containerRef.current
    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect()
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2))
    renderer.setSize(containerWidth, containerHeight)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, containerWidth / containerHeight, 0.1, 100)
    camera.position.set(2.4, 2.1, 5.3)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.6
    controls.target.set(0, 0.5, 0)
    controls.update()

    const ambient = new THREE.AmbientLight(0xffffff, 0.7)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9)
    keyLight.position.set(3.5, 3, 2)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.45)
    fillLight.position.set(-3, -1.5, -2)
    scene.add(ambient, keyLight, fillLight)

    const group = new THREE.Group()
    scene.add(group)

    const totalLength = elements.reduce((sum, element) => sum + element.length, 0) || 1
    const sceneLength = 4.8
    const scale = sceneLength / totalLength
    const baseWidth = 0.9
    const baseDepth = 0.6

    const minScale = Math.min(...elements.map((element) => element.areaScale))
    const maxScale = Math.max(...elements.map((element) => element.areaScale))
    const scaleRange = maxScale - minScale || 1

    const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
    const edgeGeometry = new THREE.EdgesGeometry(boxGeometry)

    const meshes: THREE.Mesh[] = []
    const edges: THREE.LineSegments[] = []

    elements.forEach((element) => {
      const material = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.35,
        metalness: 0.18,
      })
      const mesh = new THREE.Mesh(boxGeometry, material)
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x1f2937,
        transparent: true,
        opacity: 0.35,
      })
      const edge = new THREE.LineSegments(edgeGeometry, edgeMaterial)
      group.add(mesh)
      group.add(edge)
      meshes.push(mesh)
      edges.push(edge)
    })

    let cursor = -sceneLength / 2
    elements.forEach((element, index) => {
      const length = element.length * scale
      const halfLength = length / 2
      const width = baseWidth * element.areaScale
      const depth = baseDepth * element.areaScale
      const centerY = cursor + halfLength
      cursor += length

      const mesh = meshes[index]
      const edge = edges[index]

      mesh.scale.set(width, length, depth)
      edge.scale.set(width, length, depth)
      mesh.position.set(0, centerY, 0)
      edge.position.set(0, centerY, 0)

      const normalized = (element.areaScale - minScale) / scaleRange
      const color = mapColor(normalized)
      ;(mesh.material as THREE.MeshStandardMaterial).color = color
    })

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
      boxGeometry.dispose()
      edgeGeometry.dispose()
      meshes.forEach((mesh) => {
        ;(mesh.material as THREE.Material).dispose()
      })
      edges.forEach((edge) => {
        ;(edge.material as THREE.Material).dispose()
      })
      renderer.dispose()
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement)
      }
    }
  }, [elements])

  if (!elements.length) {
    return (
      <div className="h-[320px] flex items-center justify-center rounded-xl border border-dashed border-border">
        <p className="text-sm text-muted-foreground">Sem malha para visualizar.</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-[320px] w-full rounded-xl border border-border bg-white/80 dark:bg-black/40"
    />
  )
}

export function MefVerificationClient() {
  const { settings } = useSettings()
  const unitLabels = getUnitLabels(settings.unitSystem)
  const [model, setModel] = useState<MaterialModel>('nonlinear')
  const [load, setLoad] = useState<number>(LOAD_LEVELS[1])
  const [meshCount, setMeshCount] = useState<number>(MESH_LEVELS[2])

  const convergence = useMemo(() => buildConvergence(load, model, DEFAULT_PARAMS), [load, model])

  const selectedResponse = useMemo(() => {
    const elements = buildElements(meshCount, BAR_LENGTH, BASE_AREA)
    return solveBarResponse(load, model, DEFAULT_PARAMS, elements)
  }, [load, meshCount, model])

  const lengthUnit = settings.unitSystem === 'imperial' ? 'in' : 'mm'
  const convertLength = (value: number) =>
    settings.unitSystem === 'imperial' ? value * MM_TO_IN : value

  const formatStress = (value: number) => {
    const converted = convertStress(value, settings.unitSystem) ?? value
    return `${stressFormatter.format(converted)} ${unitLabels.stress}`
  }

  const elementLength = selectedResponse.elements[0]?.length ?? BAR_LENGTH / meshCount
  const absoluteError = Math.abs(selectedResponse.totalDisplacement - convergence.reference)
  const relativeError = convergence.reference > 0 ? absoluteError / convergence.reference : 0

  const summaryMetrics = [
    {
      label: 'Elementos na malha',
      value: `${meshCount}`,
      hint: 'Refinamento atual',
    },
    {
      label: 'Tamanho h',
      value: `${displacementFormatter.format(convertLength(elementLength))} ${lengthUnit}`,
      hint: 'Comprimento por elemento',
    },
    {
      label: 'Erro absoluto',
      value: `${displacementFormatter.format(convertLength(absoluteError))} ${lengthUnit}`,
      hint: 'Δu = |u_h - u_ref|',
    },
    {
      label: 'Erro relativo',
      value: `${percentFormatter.format(relativeError * 100)}%`,
      hint: 'Comparado a u_ref',
    },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:h-[calc(100svh-220px)] lg:items-stretch lg:overflow-hidden">
      <Card className="flex h-full flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
              <Gauge className="size-5 text-foreground" />
            </div>
            <div>
              <CardTitle>Configuração do estudo</CardTitle>
              <CardDescription>Parâmetros de modelo e refinamento</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <Tabs defaultValue="config" className="space-y-3">
            <TabsList className="grid w-full grid-cols-2 h-auto gap-1 p-1">
              <TabsTrigger value="config" className="py-2.5">
                Configuração
              </TabsTrigger>
              <TabsTrigger value="summary" className="py-2.5">
                Resumo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Modelo constitutivo
                </p>
                <Select value={model} onValueChange={(value) => setModel(value as MaterialModel)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear elastico</SelectItem>
                    <SelectItem value="nonlinear">Ramberg-Osgood</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Nível de carga
                </p>
                <Select value={String(load)} onValueChange={(value) => setLoad(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a carga" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAD_LEVELS.map((level) => (
                      <SelectItem key={level} value={String(level)}>
                        {(level / 1000).toFixed(1)} kN
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Elementos na malha
                </p>
                <Select
                  value={String(meshCount)}
                  onValueChange={(value) => setMeshCount(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a malha" />
                  </SelectTrigger>
                  <SelectContent>
                    {MESH_LEVELS.map((level) => (
                      <SelectItem key={level} value={String(level)}>
                        {level} elementos
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/30 p-4">
                <p className="text-sm font-semibold text-foreground">Parâmetros fixos</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">E {formatStress(DEFAULT_PARAMS.E)}</Badge>
                  <Badge variant="outline">σ₀ {formatStress(DEFAULT_PARAMS.sigma_0)}</Badge>
                  <Badge variant="outline">n {DEFAULT_PARAMS.n.toFixed(1)}</Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="summary">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {summaryMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-border/80 bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="flex h-full flex-col overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
              <Orbit className="size-5 text-foreground" />
            </div>
            <div>
              <CardTitle>Resultados numéricos</CardTitle>
              <CardDescription>Discretização, convergência e erro numérico</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <Tabs defaultValue="mesh" className="flex h-full flex-col">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
              <TabsTrigger value="mesh" className="py-2.5">
                Discretização
              </TabsTrigger>
              <TabsTrigger value="convergence" className="py-2.5">
                Convergência
              </TabsTrigger>
              <TabsTrigger value="table" className="py-2.5">
                Tabela
              </TabsTrigger>
              <TabsTrigger value="notes" className="py-2.5">
                Notas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mesh" className="mt-3">
              <MeshScene elements={selectedResponse.elements} />
            </TabsContent>

            <TabsContent value="convergence" className="mt-3">
              <ChartContainer
                config={{
                  error: {
                    label: 'Erro relativo',
                    color: 'var(--chart-1)',
                  },
                }}
                className="h-80 w-full aspect-auto"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={convergence.points}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="elements"
                      className="text-xs"
                      name="Elementos"
                      tickFormatter={(value) => value.toString()}
                    />
                    <YAxis
                      className="text-xs"
                      tickFormatter={(value) => `${percentFormatter.format(value * 100)}%`}
                      name="Erro relativo"
                    />
                    <ReferenceLine y={0} stroke="var(--color-error)" strokeDasharray="4 4" />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, _name, payload) => {
                            const entry =
                              payload && !Array.isArray(payload) ? payload.payload : undefined
                            if (!entry) return value as number
                            return (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-muted-foreground">Elementos</span>
                                  <span className="font-mono font-semibold">{entry.elements}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-muted-foreground">Erro relativo</span>
                                  <span className="font-mono font-semibold">
                                    {percentFormatter.format(entry.error * 100)}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-muted-foreground">Deslocamento</span>
                                  <span className="font-mono font-semibold">
                                    {displacementFormatter.format(
                                      convertLength(entry.displacement)
                                    )}{' '}
                                    {lengthUnit}
                                  </span>
                                </div>
                              </div>
                            )
                          }}
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="error"
                      stroke="var(--color-error)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>

            <TabsContent value="table" className="mt-3">
              <div className="grid gap-2 text-xs text-muted-foreground">
                <div className="grid grid-cols-4 rounded-lg bg-muted/40 px-3 py-2 font-semibold text-foreground">
                  <span>Elementos</span>
                  <span>h ({lengthUnit})</span>
                  <span>Deslocamento ({lengthUnit})</span>
                  <span>Erro rel.</span>
                </div>
                {convergence.points.map((point) => (
                  <div
                    key={point.elements}
                    className="grid grid-cols-4 rounded-lg border border-border/60 px-3 py-2"
                  >
                    <span className="font-semibold text-foreground">{point.elements}</span>
                    <span>
                      {displacementFormatter.format(convertLength(point.elementLength))}
                    </span>
                    <span>
                      {displacementFormatter.format(convertLength(point.displacement))} {lengthUnit}
                    </span>
                    <span>{percentFormatter.format(point.error * 100)}%</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-3">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Procedimento: definir malha de referência, comparar erro relativo e validar a
                  estabilidade numérica ao refinar elementos.
                </p>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 font-mono text-xs">
                  erro = |u_h - u_ref| / u_ref
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
