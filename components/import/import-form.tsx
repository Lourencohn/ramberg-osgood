'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  UploadCloud,
  Layers,
  FileSpreadsheet,
  Thermometer,
  Gauge,
  Ruler,
  Settings2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

type ImportResult = {
  file: string
  rows: number
  testRunId: number
  testNumber: number
  computed: {
    stressFromArea: boolean
    strainFromLength: boolean
  }
}

type ImportResponse = {
  ok: boolean
  material: string
  profileCode: string
  results: ImportResult[]
}

export function ImportForm() {
  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [response, setResponse] = useState<ImportResponse | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const fileLabel = useMemo(() => {
    if (mode === 'batch') return 'Arquivos (mesma configuracao)'
    return 'Arquivo de ensaio'
  }, [mode])

  useEffect(() => {
    setSelectedFiles([])
  }, [mode])

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    setSelectedFiles(files)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setResponse(null)

    const formData = new FormData(event.currentTarget)
    const files = formData
      .getAll('files')
      .filter((item) => item instanceof File && item.size > 0) as File[]

    if (!files.length) {
      setError('Selecione pelo menos um arquivo CSV/TXT.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/import/manual', {
        method: 'POST',
        body: formData,
      })
      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Falha ao importar os arquivos.')
      }
      setResponse(payload as ImportResponse)
      setSelectedFiles([])
      event.currentTarget.reset()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Falha ao importar os arquivos.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Configuracao da Importacao</CardTitle>
          <CardDescription>
            Envie arquivos de tracao/deformacao para inserir no banco local.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="material" className="text-sm font-medium">
                Material
              </Label>
              <Input id="material" name="material" placeholder="Ex: PLA, ABS, PETG" required />
            </div>
            <div className="space-y-3">
              <Label htmlFor="materialGrade" className="text-sm font-medium">
                Grau / Variante (opcional)
              </Label>
              <Input id="materialGrade" name="materialGrade" placeholder="Ex: ABS Black" />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-3">
              <Label htmlFor="temperature" className="flex items-center gap-2 text-sm font-medium">
                <Thermometer className="size-4 text-foreground" />
                Temperatura (C) opcional
              </Label>
              <Input
                id="temperature"
                name="temperature"
                type="number"
                step="0.1"
                placeholder="235"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="speed" className="flex items-center gap-2 text-sm font-medium">
                <Gauge className="size-4 text-foreground" />
                Velocidade (mm/s) opcional
              </Label>
              <Input id="speed" name="speed" type="number" step="0.1" placeholder="60" />
            </div>
            <div className="space-y-3">
              <Label htmlFor="layerHeight" className="text-sm font-medium">
                Altura de camada (mm) opcional
              </Label>
              <Input
                id="layerHeight"
                name="layerHeight"
                type="number"
                step="0.01"
                placeholder="0.5"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
              <Ruler className="size-4" />
              Geometria do corpo de prova (opcional)
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="specimenLength" className="text-xs text-muted-foreground">
                  Comprimento util (mm)
                </Label>
                <Input id="specimenLength" name="specimenLength" type="number" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specimenWidth" className="text-xs text-muted-foreground">
                  Largura (mm)
                </Label>
                <Input id="specimenWidth" name="specimenWidth" type="number" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specimenThickness" className="text-xs text-muted-foreground">
                  Espessura (mm)
                </Label>
                <Input id="specimenThickness" name="specimenThickness" type="number" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specimenArea" className="text-xs text-muted-foreground">
                  Area (mm2)
                </Label>
                <Input id="specimenArea" name="specimenArea" type="number" step="0.01" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Se informado, o sistema calcula tensao a partir da forca e deformacao a partir do
              deslocamento.
            </p>
          </div>

          <Tabs value={mode} onValueChange={(value) => setMode(value as 'single' | 'batch')}>
            <TabsList className="grid w-full grid-cols-2 h-11">
              <TabsTrigger value="single" className="gap-2 text-xs sm:text-sm">
                <FileSpreadsheet className="size-4 hidden sm:block" />
                Importacao unica
              </TabsTrigger>
              <TabsTrigger value="batch" className="gap-2 text-xs sm:text-sm">
                <Layers className="size-4 hidden sm:block" />
                Importacao em lote
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testNumber" className="text-sm font-medium">
                  Numero do ensaio
                </Label>
                <Input id="testNumber" name="testNumber" type="number" min="1" defaultValue="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="files-single" className="text-sm font-medium">
                  {fileLabel}
                </Label>
                <Input
                  key={mode}
                  id="files-single"
                  name="files"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFilesChange}
                />
              </div>
            </TabsContent>

            <TabsContent value="batch" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testNumberStart" className="text-sm font-medium">
                  Numero inicial dos ensaios
                </Label>
                <Input
                  id="testNumberStart"
                  name="testNumberStart"
                  type="number"
                  min="1"
                  defaultValue="1"
                />
                <p className="text-xs text-muted-foreground">
                  Os arquivos serao importados como ensaios sequenciais a partir deste numero.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="files-batch" className="text-sm font-medium">
                  {fileLabel}
                </Label>
                <Input
                  key={mode}
                  id="files-batch"
                  name="files"
                  type="file"
                  accept=".csv,.txt"
                  multiple
                  onChange={handleFilesChange}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="rounded-xl border border-border bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <UploadCloud className="size-4" />
                Arquivos selecionados
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedFiles.length ? `${selectedFiles.length} arquivo(s)` : 'Nenhum arquivo'}
              </div>
            </div>
            {selectedFiles.length > 0 ? (
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                {selectedFiles.map((file) => (
                  <div key={file.name} className="flex items-center justify-between gap-2">
                    <span className="text-foreground">{file.name}</span>
                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                Aceita arquivos CSV ou TXT com cabecalho de tensao/deformacao.
              </p>
            )}
          </div>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" className="gap-2">
                <Settings2 className="size-4" />
                Opcoes avancadas de parsing
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="delimiter" className="text-sm font-medium">
                    Delimitador
                  </Label>
                  <Input id="delimiter" name="delimiter" placeholder="Ex: ,  ;  tab  space" />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para deteccao automatica.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="columns" className="text-sm font-medium">
                    Colunas (sem cabecalho)
                  </Label>
                  <Input
                    id="columns"
                    name="columns"
                    placeholder="tempo_s,deformacao_mm_mm,tensao_mpa"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use quando o arquivo nao possui cabecalho.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="materialSupplier" className="text-sm font-medium">
                    Fornecedor (opcional)
                  </Label>
                  <Input
                    id="materialSupplier"
                    name="materialSupplier"
                    placeholder="Ex: Supplier X"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileCode" className="text-sm font-medium">
                    Codigo do perfil (opcional)
                  </Label>
                  <Input id="profileCode" name="profileCode" placeholder="Ex: ABS_T235_V60" />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {response ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
              <CheckCircle2 className="size-4" />
              <AlertDescription>
                Importacao concluida para {response.material} ({response.profileCode}).{' '}
                {response.results.length} arquivo(s) processado(s).
              </AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Importando...' : 'Importar dados'}
          </Button>
        </CardContent>
      </Card>

      {response ? (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Resumo da importacao</CardTitle>
            <CardDescription>Resultados por arquivo processado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {response.results.map((result) => (
              <div
                key={`${result.file}-${result.testRunId}`}
                className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{result.file}</p>
                  <p className="text-xs text-muted-foreground">
                    Ensaio {result.testNumber} · {result.rows} pontos
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border px-2 py-1">
                    Tensao: {result.computed.stressFromArea ? 'calculada' : 'original'}
                  </span>
                  <span className="rounded-full border px-2 py-1">
                    Deformacao: {result.computed.strainFromLength ? 'calculada' : 'original'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </form>
  )
}
