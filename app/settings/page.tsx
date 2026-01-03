import { DashboardLayout } from '@/components/layout/dashboard-layout'
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
} from 'lucide-react'

export default function SettingsPage() {
  return (
    <DashboardLayout>
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
                <Select defaultValue="polynomial">
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
                  defaultValue="100"
                  min="50"
                  max="500"
                  className="h-11"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Validação Automática</Label>
                    <p className="text-xs text-muted-foreground">
                      Verificar limites dos parâmetros
                    </p>
                  </div>
                </div>
                <Switch defaultChecked />
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
                <Select defaultValue="system">
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
                <Select defaultValue="si">
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
                    <p className="text-xs text-muted-foreground">Habilitar zoom e pan</p>
                  </div>
                </div>
                <Switch defaultChecked />
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
                <Select defaultValue="csv">
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
                        Adicionar visualizações ao relatório
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Save className="size-5 text-foreground" />
                    <div>
                      <Label className="text-sm font-medium">Auto-salvar Simulações</Label>
                      <p className="text-xs text-muted-foreground">
                        Salvar automaticamente no histórico
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
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
                  defaultValue="50"
                  min="10"
                  max="200"
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
                <Switch />
              </div>

              <Button
                variant="outline"
                className="w-full h-11 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <RotateCcw className="size-4" />
                Resetar Todas Configurações
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" className="gap-2">
            <X className="size-4" />
            Cancelar
          </Button>
          <Button className="gap-2 shadow-md">
            <Save className="size-4" />
            Salvar Configurações
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
