'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

type AxisMeta = {
  label: string
  format: (value: number) => string
}

export type ParameterSpacePoint = {
  id: string
  label: string
  x: number
  y: number
  z: number
  colorValue: number
}

type ParameterSpaceChartProps = {
  points: ParameterSpacePoint[]
  highlightId?: string | null
  axis: {
    x: AxisMeta
    y: AxisMeta
    z: AxisMeta
    color: AxisMeta
  }
}

type AxisBounds = {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  zMin: number
  zMax: number
  colorMin: number
  colorMax: number
}

function mapColor(t: number) {
  const clamped = Math.max(0, Math.min(1, t))
  const color = new THREE.Color()
  color.setHSL(0.6 - 0.55 * clamped, 0.6, 0.5)
  return color
}

export function ParameterSpaceChart({ points, highlightId, axis }: ParameterSpaceChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isReady, setIsReady] = useState(false)

  const bounds = useMemo<AxisBounds | null>(() => {
    if (points.length < 2) return null
    const xValues = points.map((point) => point.x)
    const yValues = points.map((point) => point.y)
    const zValues = points.map((point) => point.z)
    const cValues = points.map((point) => point.colorValue)
    return {
      xMin: Math.min(...xValues),
      xMax: Math.max(...xValues),
      yMin: Math.min(...yValues),
      yMax: Math.max(...yValues),
      zMin: Math.min(...zValues),
      zMax: Math.max(...zValues),
      colorMin: Math.min(...cValues),
      colorMax: Math.max(...cValues),
    }
  }, [points])

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
    if (!containerRef.current || !bounds || !isReady) return undefined

    const container = containerRef.current
    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect()
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio ?? 1)
    renderer.setSize(containerWidth, containerHeight)
    renderer.setClearColor(0xffffff, 0)
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, containerWidth / containerHeight, 0.1, 100)
    camera.position.set(1.8, -1.7, 1.2)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.target.set(0, 0, 0.25)
    controls.update()

    const ambient = new THREE.AmbientLight(0xffffff, 0.65)
    const directional = new THREE.DirectionalLight(0xffffff, 0.7)
    directional.position.set(2.2, 1.3, 1.8)
    scene.add(ambient, directional)

    const xRange = bounds.xMax - bounds.xMin || 1
    const yRange = bounds.yMax - bounds.yMin || 1
    const zRange = bounds.zMax - bounds.zMin || 1
    const colorRange = bounds.colorMax - bounds.colorMin || 1
    const maxRange = Math.max(xRange, yRange) || 1

    const width = 1.55 * (xRange / maxRange)
    const depth = 1.55 * (yRange / maxRange)
    const height = 0.8

    const mapX = (value: number) => ((value - bounds.xMin) / xRange - 0.5) * width
    const mapY = (value: number) => ((value - bounds.yMin) / yRange - 0.5) * depth
    const mapZ = (value: number) => ((value - bounds.zMin) / zRange) * height
    const mapColorValue = (value: number) => (value - bounds.colorMin) / colorRange

    const positions = new Float32Array(points.length * 3)
    const colors = new Float32Array(points.length * 3)
    points.forEach((point, index) => {
      positions[index * 3] = mapX(point.x)
      positions[index * 3 + 1] = mapY(point.y)
      positions[index * 3 + 2] = mapZ(point.z)
      const color = mapColor(mapColorValue(point.colorValue))
      colors[index * 3] = color.r
      colors[index * 3 + 1] = color.g
      colors[index * 3 + 2] = color.b
    })

    const pointsGeometry = new THREE.BufferGeometry()
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const pointsMaterial = new THREE.PointsMaterial({ size: 0.035, vertexColors: true })
    const pointsMesh = new THREE.Points(pointsGeometry, pointsMaterial)
    scene.add(pointsMesh)

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

    let highlightGeometry: THREE.SphereGeometry | null = null
    let highlightMaterial: THREE.MeshStandardMaterial | null = null
    if (highlightId) {
      const highlight = points.find((point) => point.id === highlightId)
      if (highlight) {
        highlightGeometry = new THREE.SphereGeometry(0.045, 18, 18)
        highlightMaterial = new THREE.MeshStandardMaterial({
          color: 0xf97316,
          emissive: 0x7c2d12,
          emissiveIntensity: 0.4,
        })
        const highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial)
        highlightMesh.position.set(mapX(highlight.x), mapY(highlight.y), mapZ(highlight.z))
        scene.add(highlightMesh)
      }
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
      pointsGeometry.dispose()
      pointsMaterial.dispose()
      axisGeometry.dispose()
      axisMaterial.dispose()
      highlightGeometry?.dispose()
      highlightMaterial?.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement)
      }
    }
  }, [bounds, highlightId, isReady, points])

  if (!points.length) {
    return (
      <div className="h-[320px] flex items-center justify-center rounded-xl border border-dashed border-border">
        <p className="text-sm text-muted-foreground">Sem pontos para o atlas 3D.</p>
      </div>
    )
  }

  if (!bounds) {
    return (
      <div className="h-[320px] flex items-center justify-center rounded-xl border border-dashed border-border">
        <p className="text-sm text-muted-foreground">
          Dados insuficientes para mapa paramétrico.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="h-[320px] w-full rounded-xl border border-border bg-white/80 dark:bg-black/40"
      />
      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
          <p className="font-semibold text-foreground">Eixos</p>
          <p>
            X: {axis.x.label} {axis.x.format(bounds.xMin)} - {axis.x.format(bounds.xMax)}
          </p>
          <p>
            Y: {axis.y.label} {axis.y.format(bounds.yMin)} - {axis.y.format(bounds.yMax)}
          </p>
          <p>
            Z: {axis.z.label} {axis.z.format(bounds.zMin)} - {axis.z.format(bounds.zMax)}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
          <p className="font-semibold text-foreground">Cor e densidade</p>
          <p>
            {axis.color.label}: {axis.color.format(bounds.colorMin)} -{' '}
            {axis.color.format(bounds.colorMax)}
          </p>
          <p>{points.length} pontos filtrados</p>
        </div>
      </div>
    </div>
  )
}
