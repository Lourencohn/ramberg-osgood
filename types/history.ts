import type { StressStrainPoint } from '@/types'

export type RunDetail = {
  id: number
  testCode: string | null
  testNumber: number
  createdAt: string
  source: string | null
  profileCode: string
  temperature: number
  speed: number
  maxStress: number | null
  maxStrain: number | null
  pointCount: number
  points: StressStrainPoint[]
}
