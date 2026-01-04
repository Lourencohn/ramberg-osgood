export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf'
export type InterpolationMethod = 'polynomial' | 'rbf' | 'auto'
export type UnitSystem = 'si' | 'imperial'

export type AppSettings = {
  interpolationMethod: InterpolationMethod
  stressCurvePoints: number
  autoValidation: boolean
  theme: 'light' | 'dark' | 'system'
  unitSystem: UnitSystem
  interactiveCharts: boolean
  exportFormat: ExportFormat
  exportIncludeCharts: boolean
  autoSavePredictions: boolean
  cacheSize: number
  debugMode: boolean
}

export const SETTINGS_STORAGE_KEY = 'resistencia-settings'

export const DEFAULT_SETTINGS: AppSettings = {
  interpolationMethod: 'rbf',
  stressCurvePoints: 100,
  autoValidation: true,
  theme: 'system',
  unitSystem: 'si',
  interactiveCharts: true,
  exportFormat: 'csv',
  exportIncludeCharts: true,
  autoSavePredictions: true,
  cacheSize: 50,
  debugMode: false,
}

const EXPORT_FORMATS = new Set<ExportFormat>(['csv', 'json', 'xlsx', 'pdf'])
const INTERPOLATION_METHODS = new Set<InterpolationMethod>(['polynomial', 'rbf', 'auto'])
const UNIT_SYSTEMS = new Set<UnitSystem>(['si', 'imperial'])
const THEMES = new Set<AppSettings['theme']>(['light', 'dark', 'system'])

const clampNumber = (value: unknown, fallback: number, min: number, max: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(Math.max(value, min), max)
}

export const normalizeSettings = (input?: Partial<AppSettings> | null): AppSettings => {
  const resolved = input ?? {}

  return {
    interpolationMethod: INTERPOLATION_METHODS.has(
      resolved.interpolationMethod as InterpolationMethod
    )
      ? (resolved.interpolationMethod as InterpolationMethod)
      : DEFAULT_SETTINGS.interpolationMethod,
    stressCurvePoints: clampNumber(
      resolved.stressCurvePoints,
      DEFAULT_SETTINGS.stressCurvePoints,
      50,
      500
    ),
    autoValidation:
      typeof resolved.autoValidation === 'boolean'
        ? resolved.autoValidation
        : DEFAULT_SETTINGS.autoValidation,
    theme: THEMES.has(resolved.theme as AppSettings['theme'])
      ? (resolved.theme as AppSettings['theme'])
      : DEFAULT_SETTINGS.theme,
    unitSystem: UNIT_SYSTEMS.has(resolved.unitSystem as UnitSystem)
      ? (resolved.unitSystem as UnitSystem)
      : DEFAULT_SETTINGS.unitSystem,
    interactiveCharts:
      typeof resolved.interactiveCharts === 'boolean'
        ? resolved.interactiveCharts
        : DEFAULT_SETTINGS.interactiveCharts,
    exportFormat: EXPORT_FORMATS.has(resolved.exportFormat as ExportFormat)
      ? (resolved.exportFormat as ExportFormat)
      : DEFAULT_SETTINGS.exportFormat,
    exportIncludeCharts:
      typeof resolved.exportIncludeCharts === 'boolean'
        ? resolved.exportIncludeCharts
        : DEFAULT_SETTINGS.exportIncludeCharts,
    autoSavePredictions:
      typeof resolved.autoSavePredictions === 'boolean'
        ? resolved.autoSavePredictions
        : DEFAULT_SETTINGS.autoSavePredictions,
    cacheSize: clampNumber(resolved.cacheSize, DEFAULT_SETTINGS.cacheSize, 10, 200),
    debugMode:
      typeof resolved.debugMode === 'boolean' ? resolved.debugMode : DEFAULT_SETTINGS.debugMode,
  }
}
