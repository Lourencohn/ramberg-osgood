import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function DocsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-balance">Documentação</h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            Guias técnicos e informações sobre o sistema de predição
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="model">Modelo Matemático</TabsTrigger>
            <TabsTrigger value="parameters">Parâmetros</TabsTrigger>
            <TabsTrigger value="interpretation">Interpretação</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sobre o Sistema</CardTitle>
                <CardDescription>Introdução ao sistema de predição de propriedades mecânicas</CardDescription>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none dark:prose-invert">
                <p>
                  Este sistema utiliza modelos matemáticos avançados para prever as propriedades mecânicas de peças
                  fabricadas em PLA através do processo de impressão 3D FDM (Fused Deposition Modeling).
                </p>
                <h3>Funcionalidades Principais</h3>
                <ul>
                  <li>Predição de resistência à tração</li>
                  <li>Cálculo do módulo de Young</li>
                  <li>Estimativa de alongamento na ruptura</li>
                  <li>Geração de curvas tensão-deformação</li>
                  <li>Visualização de superfícies de resposta 3D</li>
                </ul>
              </CardContent>
            </Card>

            <Alert>
              <Info className="size-4" />
              <AlertTitle>Importante</AlertTitle>
              <AlertDescription>
                Os resultados são baseados em modelos de metamodelagem e devem ser validados experimentalmente para
                aplicações críticas.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="model" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Modelo de Ramberg-Osgood</CardTitle>
                <CardDescription>Equação constitutiva para comportamento elasto-plástico</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  O modelo de Ramberg-Osgood é utilizado para descrever o comportamento tensão-deformação de materiais
                  com plasticidade:
                </p>
                <div className="rounded-lg bg-muted p-4 font-mono text-sm">ε = σ/E + (σ/K)^(1/n)</div>
                <div className="space-y-2 text-sm">
                  <p>Onde:</p>
                  <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                    <li>ε: Deformação total</li>
                    <li>σ: Tensão aplicada</li>
                    <li>E: Módulo de elasticidade (Young)</li>
                    <li>K: Coeficiente de resistência</li>
                    <li>n: Expoente de encruamento</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metamodelagem</CardTitle>
                <CardDescription>Interpolação de propriedades em função dos parâmetros</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  As propriedades mecânicas (σ_UTS, E, ε_break) são calculadas através de funções de interpolação que
                  relacionam temperatura e velocidade de impressão.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Métodos disponíveis:</p>
                  <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                    <li>Interpolação polinomial de segunda ordem</li>
                    <li>Função de Base Radial (RBF) - Gaussian</li>
                    <li>Validação cruzada com dados experimentais</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Limites dos Parâmetros</CardTitle>
                <CardDescription>Faixas válidas para os parâmetros de entrada</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border border-border p-4">
                    <h4 className="mb-2 font-medium">Temperatura de Extrusão</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mínimo:</span>
                      <span className="font-mono font-medium">190°C</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Máximo:</span>
                      <span className="font-mono font-medium">230°C</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Temperaturas típicas para impressão de PLA padrão
                    </p>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <h4 className="mb-2 font-medium">Velocidade de Impressão</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mínimo:</span>
                      <span className="font-mono font-medium">20 mm/s</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Máximo:</span>
                      <span className="font-mono font-medium">80 mm/s</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Velocidades recomendadas para qualidade estrutural
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interpretation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Interpretação dos Resultados</CardTitle>
                <CardDescription>Como analisar as propriedades previstas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="mb-1 text-sm font-medium">Resistência à Tração (σ_UTS)</h4>
                    <p className="text-sm text-muted-foreground">
                      Tensão máxima que o material suporta antes da ruptura. Valores típicos para PLA: 40-60 MPa. Maior
                      é melhor para aplicações estruturais.
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-1 text-sm font-medium">Módulo de Young (E)</h4>
                    <p className="text-sm text-muted-foreground">
                      Rigidez do material na região elástica. Valores típicos: 3000-3800 MPa. Maior rigidez significa
                      menor deformação sob carga.
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-1 text-sm font-medium">Alongamento na Ruptura (ε_break)</h4>
                    <p className="text-sm text-muted-foreground">
                      Deformação percentual até a ruptura. Valores típicos: 3-6%. Indica ductilidade do material
                      impresso.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Info className="size-4" />
              <AlertTitle>Tendências Gerais</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
                  <li>Temperaturas mais baixas geralmente aumentam a resistência mas reduzem adesão entre camadas</li>
                  <li>Velocidades menores permitem melhor fusão entre filamentos</li>
                  <li>Existe um compromisso ótimo entre temperatura e velocidade</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
