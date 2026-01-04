'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  normalizeSettings,
  type AppSettings,
} from '@/lib/settings'

type SettingsContextValue = {
  settings: AppSettings
  updateSettings: (next: Partial<AppSettings>) => void
  resetSettings: () => void
  isReady: boolean
}

const SettingsContext = React.createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme()
  const [settings, setSettings] = React.useState<AppSettings>(DEFAULT_SETTINGS)
  const [isReady, setIsReady] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<AppSettings>
        setSettings(normalizeSettings(parsed))
      } catch {
        setSettings(DEFAULT_SETTINGS)
      }
    }
    setIsReady(true)
  }, [])

  React.useEffect(() => {
    if (!isReady || typeof window === 'undefined') return
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  }, [settings, isReady])

  React.useEffect(() => {
    if (!isReady) return
    setTheme(settings.theme)
  }, [isReady, settings.theme, setTheme])

  const updateSettings = React.useCallback((next: Partial<AppSettings>) => {
    setSettings((current) => normalizeSettings({ ...current, ...next }))
  }, [])

  const resetSettings = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SETTINGS_STORAGE_KEY)
    }
    setSettings(DEFAULT_SETTINGS)
  }, [])

  const value = React.useMemo(
    () => ({
      settings,
      updateSettings,
      resetSettings,
      isReady,
    }),
    [settings, updateSettings, resetSettings, isReady]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = React.useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
