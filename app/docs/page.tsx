import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Info,
  BookOpen,
  Calculator,
  Settings2,
  BarChart3,
  Lightbulb,
  Thermometer,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Target,
  TrendingUp
} from "lucide-react"

export default function DocsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-foreground to-foreground/80 text-background shadow-md">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Documentação</h1>
            <p className="text-muted-foreground">
              Guias técnicos e referências do sistema de predição
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="gap-2 py-2.5">
              <Lightbulb className="size-4" />
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="model" className="gap-2 py-2.5">
              <Calculator className="size-4" />
              <span className="hidden sm:inline">Modelo</span>
              <span className="sm:hidden">Modelo</span>
            </TabsTrigger>
            <TabsTrigger value="parameters" className="gap-2 py-2.5">
              <Settings2 className="size-4" />
              <span className="hidden sm:inline">Parâmetros</span>
              <span className="sm:hidden">Params</span>
            </TabsTrigger>
            <TabsTrigger value="interpretation" className="gap-2 py-2.5">
              <BarChart3 className="size-4" />
              <span className="hidden sm:inline">Resultados</span>
              <span className="sm:hidden">Result.</span>
            </TabsTrigger>
          </TabsList>


          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                    <Zap className="size-5 text-foreground" />
                  </div>
                  <div>
                    <CardTitle>Sobre o Sistema</CardTitle>
                    <CardDescription>Sistema de predição de propriedades mecânicas para PLA</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  O ResistencIA utiliza modelos matemáticos avançados para prever as propriedades mecânicas de peças
                  fabricadas em PLA através do processo de impressão 3D FDM (Fused Deposition Modeling).
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: Target, text: "Predição de resistência à tração" },
                    { icon: TrendingUp, text: "Cálculo do módulo de Young" },
                    { icon: BarChart3, text: "Estimativa de alongamento" },
                    { icon: Calculator, text: "Curvas tensão-deformação" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                      <item.icon className="size-5 text-foreground" />
                      <span className="text-sm font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Alert className="border-foreground/20 bg-foreground/5">
              <Info className="size-4 text-foreground" />
              <AlertTitle className="text-foreground">Importante</AlertTitle>
              <AlertDescription>
                Os resultados são baseados em modelos de metamodelagem e devem ser validados experimentalmente para
                aplicações críticas de engenharia.
              </AlertDescription>
            </Alert>
          </TabsContent>


          <TabsContent value="model" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                    <Calculator className="size-5 text-foreground" />
                  </div>
                  <div>
                    <CardTitle>Modelo de Ramberg-Osgood</CardTitle>
                    <CardDescription>Equação constitutiva para comportamento elasto-plástico</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  O modelo de Ramberg-Osgood é utilizado para descrever o comportamento tensão-deformação de materiais
                  com plasticidade.
                </p>


                <div className="rounded-xl bg-gradient-to-br from-foreground/10 to-foreground/5 border border-foreground/20 p-6 text-center">
                  <p className="font-mono text-lg font-semibold text-foreground">ε = σ/E + (σ/K)^(1/n)</p>
                </div>


                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { symbol: "ε", name: "Deformação total" },
                    { symbol: "σ", name: "Tensão aplicada" },
                    { symbol: "E", name: "Módulo de elasticidade" },
                    { symbol: "K", name: "Coeficiente de resistência" },
                    { symbol: "n", name: "Expoente de encruamento" },
                  ].map((item) => (
                    <div key={item.symbol} className="flex items-center gap-3 rounded-lg border border-border p-3">
                      <span className="flex size-8 items-center justify-center rounded bg-foreground font-mono font-bold text-background">
                        {item.symbol}
                      </span>
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Metamodelagem</CardTitle>
                <CardDescription>Interpolação de propriedades em função dos parâmetros</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  As propriedades mecânicas (σ_UTS, E, ε_break) são calculadas através de funções de interpolação que
                  relacionam temperatura e velocidade de impressão.
                </p>
                <div className="space-y-2">
                  {[
                    { text: "Interpolação polinomial de segunda ordem", icon: CheckCircle2 },
                    { text: "Função de Base Radial (RBF) - Gaussian", icon: CheckCircle2 },
                    { text: "Validação cruzada com dados experimentais", icon: CheckCircle2 },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <item.icon className="size-4 text-foreground" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="parameters" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                    <Settings2 className="size-5 text-foreground" />
                  </div>
                  <div>
                    <CardTitle>Limites dos Parâmetros</CardTitle>
                    <CardDescription>Faixas válidas para os parâmetros de entrada</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="rounded-xl border border-foreground/20 bg-foreground/5 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                      <Thermometer className="size-5 text-foreground" />
                    </div>
                    <h4 className="font-semibold">Temperatura de Extrusão</h4>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg bg-card px-4 py-3">
                      <span className="text-sm text-muted-foreground">Mínimo</span>
                      <span className="font-mono font-bold text-foreground">190°C</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-card px-4 py-3">
                      <span className="text-sm text-muted-foreground">Máximo</span>
                      <span className="font-mono font-bold text-foreground">230°C</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Temperaturas típicas para impressão de PLA padrão
                  </p>
                </div>


                <div className="rounded-xl border border-foreground/20 bg-muted p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                      <Gauge className="size-5 text-foreground" />
                    </div>
                    <h4 className="font-semibold">Velocidade de Impressão</h4>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg bg-card px-4 py-3">
                      <span className="text-sm text-muted-foreground">Mínimo</span>
                      <span className="font-mono font-bold text-foreground">20 mm/s</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-card px-4 py-3">
                      <span className="text-sm text-muted-foreground">Máximo</span>
                      <span className="font-mono font-bold text-foreground">80 mm/s</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Velocidades recomendadas para qualidade estrutural
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="interpretation" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-foreground/10">
                    <BarChart3 className="size-5 text-foreground" />
                  </div>
                  <div>
                    <CardTitle>Interpretação dos Resultados</CardTitle>
                    <CardDescription>Como analisar as propriedades previstas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-foreground/20 bg-foreground/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">Resistência à Tração (σ_UTS)</h4>
                    <span className="text-xs font-mono font-semibold px-2 py-1 rounded-full bg-foreground text-background">
                      40-60 MPa
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Tensão máxima que o material suporta antes da ruptura. Maior é melhor para aplicações estruturais.
                  </p>
                </div>

                <div className="rounded-xl border border-foreground/20 bg-muted p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">Módulo de Young (E)</h4>
                    <span className="text-xs font-mono font-semibold px-2 py-1 rounded-full bg-foreground/80 text-background">
                      3000-3800 MPa
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Rigidez do material na região elástica. Maior rigidez significa menor deformação sob carga.
                  </p>
                </div>

                <div className="rounded-xl border border-foreground/20 bg-foreground/5 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">Alongamento na Ruptura (ε_break)</h4>
                    <span className="text-xs font-mono font-semibold px-2 py-1 rounded-full bg-foreground/60 text-background">
                      3-6%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Deformação percentual até a ruptura. Indica ductilidade do material impresso.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Alert className="border-foreground/20 bg-muted">
              <AlertTriangle className="size-4 text-foreground" />
              <AlertTitle className="text-foreground">Tendências Gerais</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 rounded-full bg-foreground flex-shrink-0" />
                    Temperaturas mais baixas geralmente aumentam a resistência mas reduzem adesão entre camadas
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 rounded-full bg-foreground flex-shrink-0" />
                    Velocidades menores permitem melhor fusão entre filamentos
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 rounded-full bg-foreground flex-shrink-0" />
                    Existe um compromisso ótimo entre temperatura e velocidade
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
