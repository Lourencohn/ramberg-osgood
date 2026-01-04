import type { UnitSystem } from '@/lib/settings'

const MPa_TO_PSI = 145.0377377
const MM_TO_IN = 0.0393700787

export type UnitLabels = {
  temperature: string
  speed: string
  stress: string
  strain: string
  energy: string
}

export const getUnitLabels = (unitSystem: UnitSystem): UnitLabels => {
  if (unitSystem === 'imperial') {
    return {
      temperature: '°F',
      speed: 'in/s',
      stress: 'psi',
      strain: 'in/in',
      energy: 'psi',
    }
  }
  return {
    temperature: '°C',
    speed: 'mm/s',
    stress: 'MPa',
    strain: 'mm/mm',
    energy: 'MJ/m3',
  }
}

const convertNumber = (value: number | null | undefined, factor: number) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  return value * factor
}

export const convertTemperature = (value: number | null | undefined, unitSystem: UnitSystem) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  if (unitSystem === 'imperial') {
    return value * 1.8 + 32
  }
  return value
}

export const toBaseTemperature = (value: number | null | undefined, unitSystem: UnitSystem) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  if (unitSystem === 'imperial') {
    return (value - 32) / 1.8
  }
  return value
}

export const convertSpeed = (value: number | null | undefined, unitSystem: UnitSystem) => {
  if (unitSystem === 'imperial') {
    return convertNumber(value, MM_TO_IN)
  }
  return value ?? null
}

export const toBaseSpeed = (value: number | null | undefined, unitSystem: UnitSystem) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  if (unitSystem === 'imperial') {
    return value / MM_TO_IN
  }
  return value
}

export const convertStress = (value: number | null | undefined, unitSystem: UnitSystem) => {
  if (unitSystem === 'imperial') {
    return convertNumber(value, MPa_TO_PSI)
  }
  return value ?? null
}

export const convertEnergyDensity = (value: number | null | undefined, unitSystem: UnitSystem) => {
  if (unitSystem === 'imperial') {
    return convertNumber(value, MPa_TO_PSI)
  }
  return value ?? null
}

export const convertStrain = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return null
  return value
}
