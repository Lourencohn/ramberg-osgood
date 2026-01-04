'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Settings,
  Calculator,
  Palette,
  FileOutput,
  Wrench,
  RotateCcw,
  Save,
  X,
  CheckCircle2,
  Zap,
  LineChart,
  Moon,
  Sun,
  Monitor,
  Database,
  Trash2,
} from 'lucide-react'

import { useSettings } from '@/components/settings-provider'
import type { AppSettings, ExportFormat } from '@/lib/settings'
import { getSavedPredictionsCount, clearSavedPredictions } from '@/lib/prediction-storage'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const toNumber = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

export function SettingsClient() {
  const { settings, updateSettings, resetSettings, isReady } = useSettings()
  const [draft, setDraft] = useState<AppSettings>(settings)
  const [status, setStatus] = useState<string | null>(null)
  const [cacheCount, setCacheCount] = useState(0)

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  useEffect(() => {
    if (!isReady) return
    setCacheCount(getSavedPredictionsCount())
  }, [isReady])

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings),
    [draft, settings]
  )

  const updateField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setStatus(null)
  }

  const handleSave = () => {
    updateSettings(draft)
    setStatus('Configurações salvas com sucesso.')
  }

  const handleCancel = () => {
    setDraft(settings)
    setStatus('Alterações descartadas.')
  }

  const handleReset = () => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Deseja restaurar todas as configurações padrão?')
      if (!confirmed) return
    }
    resetSettings()
    setStatus('Configurações restauradas para o padrão.')
  }

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Deseja limpar o cache de simulações salvas?')
      if (!confirmed) return
    }
    clearSavedPredictions()
    setCacheCount(0)
    setStatus('Cache de simulações limpo.')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-foreground to-foreground/80 text-background shadow-md">
            <Settings className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Configurações</h1>
            <p className="text-muted-foreground">
              Personalize o comportamento e aparência do sistema
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                <Calculator className="size-5 text-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Preferências de Cálculo</CardTitle>
                <CardDescription>Métodos de predição e precisão</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="interpolation-method" className="text-sm font-medium">
                Método de Interpolação
              </Label>
              <Select
                value={draft.interpolationMethod}
                onValueChange={(value) =>
                  updateField('interpolationMethod', value as AppSettings['interpolationMethod'])
                }
              >
                <SelectTrigger id="interpolation-method" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="polynomial">Polinomial (2ª ordem)</SelectItem>
                  <SelectItem value="rbf">RBF Gaussian</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stress-points" className="text-sm font-medium">
                Pontos na Curva σ-ε
              </Label>
              <Input
                id="stress-points"
                type="number"
                value={draft.stressCurvePoints}
                min="50"
                max="500"
                onChange={(event) =>
                  updateField(
                    'stressCurvePoints',
                    toNumber(event.target.value, draft.stressCurvePoints)
                  )
                }
                className="h-11"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-foreground" />
                <div>
                  <Label className="text-sm font-medium">Validação Automática</Label>
                  <p className="text-xs text-muted-foreground">Verificar limites dos parâmetros</p>
                </div>
              </div>
              <Switch
                checked={draft.autoValidation}
                onCheckedChange={(checked) => updateField('autoValidation', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                <Palette className="size-5 text-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Interface</CardTitle>
                <CardDescription>Aparência da dashboard</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="theme" className="text-sm font-medium">
                Tema
              </Label>
              <Select
                value={draft.theme}
                onValueChange={(value) => updateField('theme', value as AppSettings['theme'])}
              >
                <SelectTrigger id="theme" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="size-4" />
                      Claro
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="size-4" />
                      Escuro
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="size-4" />
                      Sistema
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="units" className="text-sm font-medium">
                Sistema de Unidades
              </Label>
              <Select
                value={draft.unitSystem}
                onValueChange={(value) =>
                  updateField('unitSystem', value as AppSettings['unitSystem'])
                }
              >
                <SelectTrigger id="units" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="si">SI (MPa, mm, °C)</SelectItem>
                  <SelectItem value="imperial">Imperial (psi, in, °F)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <LineChart className="size-5 text-foreground" />
                <div>
                  <Label className="text-sm font-medium">Gráficos Interativos</Label>
                  <p className="text-xs text-muted-foreground">Habilitar tooltips e destaque</p>
                </div>
              </div>
              <Switch
                checked={draft.interactiveCharts}
                onCheckedChange={(checked) => updateField('interactiveCharts', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                <FileOutput className="size-5 text-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Exportação</CardTitle>
                <CardDescription>Relatórios e dados</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="export-format" className="text-sm font-medium">
                Formato Padrão
              </Label>
              <Select
                value={draft.exportFormat}
                onValueChange={(value) => updateField('exportFormat', value as ExportFormat)}
              >
                <SelectTrigger id="export-format" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <Zap className="size-5 text-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Incluir Gráficos</Label>
                    <p className="text-xs text-muted-foreground">
                      Adicionar curvas e pontos nos arquivos
                    </p>
                  </div>
                </div>
                <Switch
                  checked={draft.exportIncludeCharts}
                  onCheckedChange={(checked) => updateField('exportIncludeCharts', checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <Save className="size-5 text-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Auto-salvar Simulações</Label>
                    <p className="text-xs text-muted-foreground">
                      Salvar automaticamente no histórico local
                    </p>
                  </div>
                </div>
                <Switch
                  checked={draft.autoSavePredictions}
                  onCheckedChange={(checked) => updateField('autoSavePredictions', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                <Wrench className="size-5 text-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Avançado</CardTitle>
                <CardDescription>Configurações técnicas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="cache-size" className="text-sm font-medium">
                Tamanho do Cache
              </Label>
              <Input
                id="cache-size"
                type="number"
                value={draft.cacheSize}
                min="10"
                max="200"
                onChange={(event) =>
                  updateField('cacheSize', toNumber(event.target.value, draft.cacheSize))
                }
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Número de simulações mantidas em memória
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <Wrench className="size-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">Modo Debug</Label>
                  <p className="text-xs text-muted-foreground">Exibir informações técnicas</p>
                </div>
              </div>
              <Switch
                checked={draft.debugMode}
                onCheckedChange={(checked) => updateField('debugMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <Database className="size-5 text-foreground" />
                <div>
                  <Label className="text-sm font-medium">Cache Local</Label>
                  <p className="text-xs text-muted-foreground">
                    {cacheCount} simulações armazenadas
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={cacheCount === 0}
                onClick={handleClearCache}
              >
                <Trash2 className="size-4" />
                Limpar
              </Button>
            </div>

            <Button
              variant="outline"
              className="w-full h-11 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleReset}
            >
              <RotateCcw className="size-4" />
              Resetar Todas Configurações
            </Button>
          </CardContent>
        </Card>
      </div>

      {status ? (
        <div className="rounded-lg border border-foreground/10 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {status}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" className="gap-2" onClick={handleCancel} disabled={!isDirty}>
          <X className="size-4" />
          Cancelar
        </Button>
        <Button className="gap-2 shadow-md" onClick={handleSave} disabled={!isDirty}>
          <Save className="size-4" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
