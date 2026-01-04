'use client'

import type { PredictionResult } from '@/types'

export type SavedPrediction = {
  id: string
  createdAt: string
  result: PredictionResult
}

const STORAGE_KEY = 'resistencia-predictions'

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `pred-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

const safeParse = (raw: string | null) => {
  if (!raw) return [] as SavedPrediction[]
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => item && typeof item === 'object') as SavedPrediction[]
  } catch {
    return []
  }
}

export const loadSavedPredictions = () => {
  if (typeof window === 'undefined') return []
  return safeParse(window.localStorage.getItem(STORAGE_KEY))
}

export const savePrediction = (result: PredictionResult, limit = 50) => {
  if (typeof window === 'undefined') return []
  const items = loadSavedPredictions()
  const next = [
    {
      id: createId(),
      createdAt: new Date().toISOString(),
      result,
    },
    ...items,
  ].slice(0, Math.max(1, limit))
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export const clearSavedPredictions = () => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}

export const getSavedPredictionsCount = () => {
  return loadSavedPredictions().length
}
