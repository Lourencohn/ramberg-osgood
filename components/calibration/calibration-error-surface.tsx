'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import type { RambergOsgoodParams, StressStrainPoint } from '@/types'
import { calculateStrain } from '@/lib/ramberg-osgood'

type ErrorSurfaceGrid = {
  cols: number
  rows: number
  values: number[]
  min: number
  max: number
  bounds: {
    nMin: number
    nMax: number
    sigmaMin: number
    sigmaMax: number
  }
  best: {
    n: number
    sigma_0: number
    rmse: number
  }
  focus: {
    n: number
    sigma_0: number
    rmse: number
  }
}

type CalibrationErrorSurfaceProps = {
  points: StressStrainPoint[]
  params: RambergOsgoodParams
}

const rmseFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

const axisFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function mapColor(t: number) {
  const clamped = Math.max(0, Math.min(1, t))
  const color = new THREE.Color()
  color.setHSL(0.6 - 0.55 * clamped, 0.6, 0.5)
  return color
}

function computeRmse(points: StressStrainPoint[], params: RambergOsgoodParams) {
  if (!points.length) return 0
  let sum = 0
  let count = 0
  for (const point of points) {
    if (!Number.isFinite(point.stress) || !Number.isFinite(point.strain)) continue
    const predicted = calculateStrain(point.stress, params)
    if (!Number.isFinite(predicted)) continue
    const diff = predicted - point.strain
    sum += diff * diff
    count += 1
  }
  return count ? Math.sqrt(sum / count) : 0
}

export function CalibrationErrorSurface({ points, params }: CalibrationErrorSurfaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isReady, setIsReady] = useState(false)

  const grid = useMemo<ErrorSurfaceGrid | null>(() => {
    if (points.length < 8) return null

    // Downsample points for surface calculation to avoid main thread blocking
    const surfacePoints =
      points.length > 150
        ? points.filter((_, i) => i % Math.ceil(points.length / 150) === 0)
        : points

    const nCenter = Number.isFinite(params.n) ? params.n : 8
    const sigmaCenter = Number.isFinite(params.sigma_0) ? params.sigma_0 : 50
    const nMin = Math.max(0.5, nCenter * 0.55)
    const nMax = Math.max(nMin + 0.5, nCenter * 1.55)
    const sigmaMin = Math.max(5, sigmaCenter * 0.6)
    const sigmaMax = Math.max(sigmaMin + 5, sigmaCenter * 1.5)

    const cols = 26
    const rows = 26
    const values: number[] = []

    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    let best = {
      n: nCenter,
      sigma_0: sigmaCenter,
      rmse: Number.POSITIVE_INFINITY,
    }

    for (let row = 0; row < rows; row += 1) {
      const sigma = sigmaMin + ((sigmaMax - sigmaMin) * row) / (rows - 1)
      for (let col = 0; col < cols; col += 1) {
        const n = nMin + ((nMax - nMin) * col) / (cols - 1)
        const rmse = computeRmse(surfacePoints, {
          E: params.E,
          sigma_0: sigma,
          n,
        })
        values.push(rmse)
        if (rmse < min) {
          min = rmse
        }
        if (rmse > max) {
          max = rmse
        }
        if (rmse < best.rmse) {
          best = { n, sigma_0: sigma, rmse }
        }
      }
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return null
    }

    const focusRmse = computeRmse(surfacePoints, params)

    return {
      cols,
      rows,
      values,
      min,
      max,
      bounds: {
        nMin,
        nMax,
        sigmaMin,
        sigmaMax,
      },
      best,
      focus: {
        n: nCenter,
        sigma_0: sigmaCenter,
        rmse: focusRmse,
      },
    }
  }, [points, params])

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
    if (!containerRef.current || !grid || !isReady) return undefined

    const container = containerRef.current
    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect()
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio ?? 1)
    renderer.setSize(containerWidth, containerHeight)
    renderer.setClearColor(0xffffff, 0)
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, containerWidth / containerHeight, 0.1, 100)
    camera.position.set(1.6, -1.5, 1.1)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.target.set(0, 0, 0.24)
    controls.update()

    const ambient = new THREE.AmbientLight(0xffffff, 0.65)
    const directional = new THREE.DirectionalLight(0xffffff, 0.7)
    directional.position.set(2.2, 1.2, 1.6)
    scene.add(ambient, directional)

    const nRange = grid.bounds.nMax - grid.bounds.nMin || 1
    const sigmaRange = grid.bounds.sigmaMax - grid.bounds.sigmaMin || 1
    const maxRange = Math.max(nRange, sigmaRange) || 1
    const width = 1.4 * (nRange / maxRange)
    const depth = 1.4 * (sigmaRange / maxRange)
    const height = 0.7

    const geometry = new THREE.PlaneGeometry(width, depth, grid.cols - 1, grid.rows - 1)
    const positions = geometry.attributes.position as THREE.BufferAttribute
    const colors = new Float32Array(positions.count * 3)
    const zRange = grid.max - grid.min || 1

    for (let index = 0; index < positions.count; index += 1) {
      const value = grid.values[index]
      const normalized = (value - grid.min) / zRange
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
      roughness: 0.32,
      metalness: 0.18,
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
      opacity: 0.6,
    })
    const axisLines = new THREE.LineSegments(axisGeometry, axisMaterial)
    scene.add(axisLines)

    const mapX = (n: number) => ((n - grid.bounds.nMin) / nRange - 0.5) * width
    const mapY = (sigma: number) =>
      ((sigma - grid.bounds.sigmaMin) / sigmaRange - 0.5) * depth
    const mapZ = (rmse: number) => ((rmse - grid.min) / zRange) * height

    const focusGeometry = new THREE.SphereGeometry(0.04, 18, 18)
    const focusMaterial = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0x7c2d12,
      emissiveIntensity: 0.45,
    })
    const focusMesh = new THREE.Mesh(focusGeometry, focusMaterial)
    focusMesh.position.set(
      mapX(grid.focus.n),
      mapY(grid.focus.sigma_0),
      mapZ(grid.focus.rmse)
    )
    scene.add(focusMesh)

    const bestGeometry = new THREE.SphereGeometry(0.032, 16, 16)
    const bestMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0c4a6e,
      emissiveIntensity: 0.35,
    })
    const bestMesh = new THREE.Mesh(bestGeometry, bestMaterial)
    bestMesh.position.set(
      mapX(grid.best.n),
      mapY(grid.best.sigma_0),
      mapZ(grid.best.rmse)
    )
    scene.add(bestMesh)

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
      focusGeometry.dispose()
      focusMaterial.dispose()
      bestGeometry.dispose()
      bestMaterial.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement)
      }
    }
  }, [grid, isReady])

  if (!points.length) {
    return (
      <div className="h-[320px] flex items-center justify-center rounded-xl border border-dashed border-border">
        <p className="text-sm text-muted-foreground">
          Sem dados suficientes para estimar a superfície de erro.
        </p>
      </div>
    )
  }

  if (!grid) {
    return (
      <div className="h-[320px] flex items-center justify-center rounded-xl border border-dashed border-border">
        <p className="text-sm text-muted-foreground">
          Dados insuficientes para calcular a paisagem de calibração.
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
      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
          <p className="font-semibold text-foreground">Faixas avaliadas</p>
          <p>n: {axisFormatter.format(grid.bounds.nMin)} - {axisFormatter.format(grid.bounds.nMax)}</p>
          <p>
            σ₀: {axisFormatter.format(grid.bounds.sigmaMin)} -{' '}
            {axisFormatter.format(grid.bounds.sigmaMax)}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
          <p className="font-semibold text-foreground">Melhor ajuste</p>
          <p>RMSE: {rmseFormatter.format(grid.best.rmse)}</p>
          <p>
            n {axisFormatter.format(grid.best.n)} • σ₀ {axisFormatter.format(grid.best.sigma_0)}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
          <p className="font-semibold text-foreground">Ponto calibrado</p>
          <p>RMSE: {rmseFormatter.format(grid.focus.rmse)}</p>
          <p>
            n {axisFormatter.format(grid.focus.n)} • σ₀ {axisFormatter.format(grid.focus.sigma_0)}
          </p>
        </div>
      </div>
    </div>
  )
}
