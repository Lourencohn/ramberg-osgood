'use client'

import { useEffect, useMemo, useState } from 'react'
import {
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

type SectionProps = {
  chapter: string
  title: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}

function Section({ chapter, title, hint, icon: Icon, children }: SectionProps) {
  return (
    <section className="rounded-md border border-foreground/15 bg-card">
      <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md border border-foreground/15 bg-background text-copper-deep">
            <Icon className="size-4" />
          </span>
          <div>
            <span className="label-caps">{chapter}</span>
            <h2 className="font-display text-xl italic leading-tight">{title}</h2>
          </div>
        </div>
        <p className="hidden max-w-xs text-right text-xs text-muted-foreground sm:block">{hint}</p>
      </div>
      <div className="space-y-5 px-5 py-5">{children}</div>
    </section>
  )
}

function ToggleRow({
  label,
  hint,
  icon: Icon,
  checked,
  onCheckedChange,
}: {
  label: string
  hint: string
  icon: React.ComponentType<{ className?: string }>
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-foreground/10 bg-background px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon className="size-4 text-foreground/70" />
        <div>
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
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
    setStatus('Configurações salvas.')
  }

  const handleCancel = () => {
    setDraft(settings)
    setStatus('Alterações descartadas.')
  }

  const handleReset = () => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Restaurar todas as configurações para o padrão?')
      if (!confirmed) return
    }
    resetSettings()
    setStatus('Configurações restauradas para o padrão.')
  }

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Limpar o cache de simulações salvas?')
      if (!confirmed) return
    }
    clearSavedPredictions()
    setCacheCount(0)
    setStatus('Cache de simulações limpo.')
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <Section
          chapter="Seção 01"
          title="Cálculo"
          hint="Como o sistema interpola e valida cada predição."
          icon={Calculator}
        >
          <div className="space-y-2">
            <Label htmlFor="interpolation-method" className="label-caps">
              Método de interpolação
            </Label>
            <Select
              value={draft.interpolationMethod}
              onValueChange={(value) =>
                updateField('interpolationMethod', value as AppSettings['interpolationMethod'])
              }
            >
              <SelectTrigger id="interpolation-method" className="h-10 border-foreground/15">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="polynomial">Polinomial de segunda ordem</SelectItem>
                <SelectItem value="rbf">RBF gaussiano</SelectItem>
                <SelectItem value="auto">Automático</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stress-points" className="label-caps">
              Pontos na curva σ por ε
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
              className="h-10 border-foreground/15 font-mono-data"
            />
          </div>

          <ToggleRow
            label="Validação automática"
            hint="Avisa quando um valor sai dos limites recomendados."
            icon={CheckCircle2}
            checked={draft.autoValidation}
            onCheckedChange={(checked) => updateField('autoValidation', checked)}
          />
        </Section>

        <Section
          chapter="Seção 02"
          title="Aparência"
          hint="Como a interface se apresenta no seu navegador."
          icon={Palette}
        >
          <div className="space-y-2">
            <Label htmlFor="theme" className="label-caps">
              Tema
            </Label>
            <Select
              value={draft.theme}
              onValueChange={(value) => updateField('theme', value as AppSettings['theme'])}
            >
              <SelectTrigger id="theme" className="h-10 border-foreground/15">
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
                    Acompanhar o sistema
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="units" className="label-caps">
              Sistema de unidades
            </Label>
            <Select
              value={draft.unitSystem}
              onValueChange={(value) =>
                updateField('unitSystem', value as AppSettings['unitSystem'])
              }
            >
              <SelectTrigger id="units" className="h-10 border-foreground/15">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="si">SI (MPa, mm, °C)</SelectItem>
                <SelectItem value="imperial">Imperial (psi, in, °F)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ToggleRow
            label="Gráficos interativos"
            hint="Habilita tooltips, zoom e destaque ao passar o cursor."
            icon={LineChart}
            checked={draft.interactiveCharts}
            onCheckedChange={(checked) => updateField('interactiveCharts', checked)}
          />
        </Section>

        <Section
          chapter="Seção 03"
          title="Exportação"
          hint="Padrões usados ao baixar resultados."
          icon={FileOutput}
        >
          <div className="space-y-2">
            <Label htmlFor="export-format" className="label-caps">
              Formato padrão
            </Label>
            <Select
              value={draft.exportFormat}
              onValueChange={(value) => updateField('exportFormat', value as ExportFormat)}
            >
              <SelectTrigger id="export-format" className="h-10 border-foreground/15">
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

          <ToggleRow
            label="Incluir gráficos"
            hint="Adiciona as curvas e os pontos no arquivo exportado."
            icon={Zap}
            checked={draft.exportIncludeCharts}
            onCheckedChange={(checked) => updateField('exportIncludeCharts', checked)}
          />

          <ToggleRow
            label="Salvar simulações automaticamente"
            hint="Cada nova predição vai para o histórico local do navegador."
            icon={Save}
            checked={draft.autoSavePredictions}
            onCheckedChange={(checked) => updateField('autoSavePredictions', checked)}
          />
        </Section>

        <Section
          chapter="Seção 04"
          title="Avançado"
          hint="Controle fino do cache e modo de depuração."
          icon={Wrench}
        >
          <div className="space-y-2">
            <Label htmlFor="cache-size" className="label-caps">
              Tamanho do cache
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
              className="h-10 border-foreground/15 font-mono-data"
            />
            <p className="text-xs text-muted-foreground">
              Quantas simulações ficam guardadas em memória.
            </p>
          </div>

          <ToggleRow
            label="Modo depuração"
            hint="Mostra informações técnicas adicionais na interface."
            icon={Wrench}
            checked={draft.debugMode}
            onCheckedChange={(checked) => updateField('debugMode', checked)}
          />

          <div className="flex items-center justify-between gap-4 rounded-md border border-foreground/10 bg-background px-4 py-3">
            <div className="flex items-center gap-3">
              <Database className="size-4 text-foreground/70" />
              <div>
                <p className="text-sm font-medium">Cache local</p>
                <p className="font-mono-data text-xs text-muted-foreground">
                  {cacheCount} simulações armazenadas
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-foreground/15"
              disabled={cacheCount === 0}
              onClick={handleClearCache}
            >
              <Trash2 className="size-4" />
              Limpar
            </Button>
          </div>

          <Button
            variant="outline"
            className="h-10 w-full gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleReset}
          >
            <RotateCcw className="size-4" />
            Restaurar tudo ao padrão
          </Button>
        </Section>
      </div>

      {status ? (
        <div className="rounded-md border border-copper/30 bg-copper-soft/40 px-4 py-3 text-sm text-copper-deep">
          {status}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-foreground/15 pt-4 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          className="gap-2 border-foreground/15"
          onClick={handleCancel}
          disabled={!isDirty}
        >
          <X className="size-4" />
          Cancelar alterações
        </Button>
        <Button
          className="gap-2 bg-foreground text-background hover:bg-foreground/90"
          onClick={handleSave}
          disabled={!isDirty}
        >
          <Save className="size-4" />
          Salvar configurações
        </Button>
      </div>
    </div>
  )
}
