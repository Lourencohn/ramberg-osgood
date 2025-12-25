import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-balance">Configurações</h1>
          <p className="mt-2 text-muted-foreground text-pretty">Personalize o comportamento e aparência do sistema</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Cálculo</CardTitle>
              <CardDescription>Configure os métodos de predição e precisão</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="interpolation-method">Método de Interpolação</Label>
                <Select defaultValue="polynomial">
                  <SelectTrigger id="interpolation-method">
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
                <Label htmlFor="stress-points">Pontos na Curva σ-ε</Label>
                <Input id="stress-points" type="number" defaultValue="100" min="50" max="500" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Validação Automática</Label>
                  <p className="text-sm text-muted-foreground">Verificar limites dos parâmetros</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interface</CardTitle>
              <CardDescription>Personalize a aparência da dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <Select defaultValue="system">
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="units">Sistema de Unidades</Label>
                <Select defaultValue="si">
                  <SelectTrigger id="units">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">SI (MPa, mm, °C)</SelectItem>
                    <SelectItem value="imperial">Imperial (psi, in, °F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Gráficos Interativos</Label>
                  <p className="text-sm text-muted-foreground">Habilitar zoom e pan</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exportação</CardTitle>
              <CardDescription>Configurações de relatórios e dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="export-format">Formato Padrão</Label>
                <Select defaultValue="csv">
                  <SelectTrigger id="export-format">
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

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Incluir Gráficos</Label>
                  <p className="text-sm text-muted-foreground">Adicionar visualizações ao relatório</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-salvar Simulações</Label>
                  <p className="text-sm text-muted-foreground">Salvar automaticamente no histórico</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avançado</CardTitle>
              <CardDescription>Configurações técnicas do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cache-size">Tamanho do Cache</Label>
                <Input id="cache-size" type="number" defaultValue="50" min="10" max="200" />
                <p className="text-xs text-muted-foreground">Número de simulações mantidas em memória</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Debug</Label>
                  <p className="text-sm text-muted-foreground">Exibir informações técnicas</p>
                </div>
                <Switch />
              </div>

              <Button variant="outline" className="w-full bg-transparent">
                Resetar Todas Configurações
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline">Cancelar</Button>
          <Button>Salvar Configurações</Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
