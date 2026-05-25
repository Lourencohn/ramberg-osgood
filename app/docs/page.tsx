import Link from 'next/link'
import {
  Info,
  Calculator,
  Settings2,
  BarChart3,
  Lightbulb,
  Thermometer,
  Gauge,
  CheckCircle2,
  Target,
  TrendingUp,
  Sparkles,
  GitCompare,
  AlertTriangle,
} from 'lucide-react'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageShell } from '@/components/layout/page-shell'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function DocsPage() {
  return (
    <DashboardLayout>
      <PageShell
        chapter="Cap. XI"
        rubric="Referência"
        title="Guia do"
        accent="sistema"
        description="O essencial sobre o que o ResistencIA calcula, com qual modelo e em quais faixas de parâmetros."
      >
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 border border-foreground/15 bg-background p-1 sm:grid-cols-4">
            <TabsTrigger
              value="overview"
              className="gap-2 py-2.5 data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <Lightbulb className="size-4" />
              Visão geral
            </TabsTrigger>
            <TabsTrigger
              value="model"
              className="gap-2 py-2.5 data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <Calculator className="size-4" />
              Modelo
            </TabsTrigger>
            <TabsTrigger
              value="parameters"
              className="gap-2 py-2.5 data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <Settings2 className="size-4" />
              Parâmetros
            </TabsTrigger>
            <TabsTrigger
              value="interpretation"
              className="gap-2 py-2.5 data-[state=active]:bg-foreground data-[state=active]:text-background"
            >
              <BarChart3 className="size-4" />
              Resultados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-5">
            <Section chapter="Capítulo introdutório" title="O que o sistema faz">
              <p className="text-sm leading-relaxed text-muted-foreground">
                O ResistencIA usa ensaios reais de tração para estimar como uma peça impressa em
                FDM vai se comportar mecanicamente. Você informa a temperatura, a velocidade e o
                material; o sistema devolve a curva de tensão por deformação esperada e as
                propriedades chave.
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { icon: Target, text: 'Resistência à tração máxima (σ máx)' },
                  { icon: TrendingUp, text: 'Módulo de elasticidade (E)' },
                  { icon: BarChart3, text: 'Alongamento até a ruptura (ε)' },
                  { icon: Calculator, text: 'Curva σ por ε completa' },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-3 rounded-md border border-foreground/10 bg-background px-3 py-2.5"
                  >
                    <item.icon className="size-4 shrink-0 text-copper-deep" />
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </Section>

            <InfoCallout
              icon={Info}
              title="Aplicação na engenharia"
              body="Os resultados nascem de ajustes sobre ensaios reais. Para aplicações críticas de engenharia, valide sempre com novos ensaios próprios antes de confiar na predição."
            />

            <Section chapter="Por onde começar" title="Fluxo recomendado">
              <ol className="space-y-3 text-sm">
                {[
                  {
                    label: 'Importe seus ensaios',
                    href: '/import',
                    body: 'Envie arquivos CSV ou TXT com os pontos de tração para alimentar o banco.',
                  },
                  {
                    label: 'Gere uma predição',
                    href: '/predict',
                    body: 'Informe temperatura e velocidade. O sistema interpola a partir do que já existe.',
                  },
                  {
                    label: 'Compare ensaios',
                    href: '/compare',
                    body: 'Coloque dois ou mais perfis lado a lado para entender diferenças.',
                  },
                ].map((step, index) => (
                  <li key={step.href} className="flex items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-copper bg-copper-soft font-mono-data text-xs text-copper-deep">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="space-y-0.5">
                      <Link
                        href={step.href}
                        className="font-display text-lg italic text-foreground hover:text-copper-deep"
                      >
                        {step.label}
                      </Link>
                      <p className="text-sm text-muted-foreground">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>
          </TabsContent>

          <TabsContent value="model" className="space-y-5">
            <Section chapter="Equação base" title="Ramberg-Osgood">
              <p className="text-sm leading-relaxed text-muted-foreground">
                A equação de Ramberg-Osgood descreve o comportamento de materiais que combinam uma
                parcela elástica linear com uma parcela plástica não linear. É a relação central que
                o sistema usa para representar cada curva.
              </p>

              <div className="rounded-md border border-foreground/15 bg-background p-6 text-center">
                <p className="font-mono-data text-xl font-semibold tabular-nums">
                  ε = σ / E + (σ / K)^(1/n)
                </p>
                <p className="mt-2 font-display text-xs italic text-muted-foreground">
                  deformação total = parcela elástica + parcela plástica
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { symbol: 'ε', name: 'Deformação total' },
                  { symbol: 'σ', name: 'Tensão aplicada' },
                  { symbol: 'E', name: 'Módulo de elasticidade' },
                  { symbol: 'K', name: 'Coeficiente de resistência' },
                  { symbol: 'n', name: 'Expoente de encruamento' },
                ].map((item) => (
                  <div
                    key={item.symbol}
                    className="flex items-center gap-3 rounded-md border border-foreground/10 bg-background px-3 py-2.5"
                  >
                    <span className="flex size-9 items-center justify-center rounded-md border border-copper bg-copper-soft font-display text-xl italic text-copper-deep">
                      {item.symbol}
                    </span>
                    <span className="text-sm">{item.name}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section chapter="Interpolação" title="Metamodelagem">
              <p className="text-sm leading-relaxed text-muted-foreground">
                As propriedades de cada combinação de temperatura e velocidade saem de funções de
                interpolação treinadas com os ensaios já cadastrados. O sistema tenta dois caminhos
                e escolhe o que melhor se aproxima dos dados.
              </p>
              <ul className="space-y-2">
                {[
                  'Interpolação polinomial de segunda ordem',
                  'Função de base radial gaussiana (RBF)',
                  'Validação cruzada com os ensaios reais cadastrados',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 shrink-0 text-copper-deep" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-5">
            <Section chapter="Faixas de validade" title="Parâmetros de entrada">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Os limites abaixo refletem as faixas em que os ensaios atuais foram realizados. Fora
                delas a confiança da predição cai.
              </p>

              <ParamCard
                icon={Thermometer}
                title="Temperatura de extrusão"
                hint="Faixas típicas para PLA padrão."
                min="190°C"
                max="230°C"
              />

              <ParamCard
                icon={Gauge}
                title="Velocidade de impressão"
                hint="Velocidades recomendadas para qualidade estrutural."
                min="20 mm/s"
                max="100 mm/s"
              />
            </Section>
          </TabsContent>

          <TabsContent value="interpretation" className="space-y-5">
            <Section chapter="Como ler" title="Resultados">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Cada predição mostra três números principais. As faixas indicadas são valores
                típicos para PLA no banco atual.
              </p>

              <ResultCard
                title="Resistência à tração (σ máx)"
                range="40 a 60 MPa"
                body="Tensão mais alta que o material aguenta antes de romper. Quanto maior, mais estrutural é a peça."
              />
              <ResultCard
                title="Módulo de elasticidade (E)"
                range="3000 a 3800 MPa"
                body="Rigidez na parte linear da curva. Maior rigidez significa menos deformação sob a mesma carga."
              />
              <ResultCard
                title="Alongamento na ruptura (ε)"
                range="3% a 6%"
                body="Quanto a peça consegue deformar até romper. Valores maiores indicam mais ductilidade."
              />
            </Section>

            <InfoCallout
              icon={AlertTriangle}
              title="Tendências observadas nos ensaios"
              body={
                <ul className="mt-1 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-copper" />
                    Temperaturas mais baixas costumam aumentar a resistência, mas reduzem a adesão
                    entre camadas.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-copper" />
                    Velocidades mais baixas permitem melhor fusão entre filamentos.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-copper" />
                    Existe sempre um ponto ótimo entre temperatura e velocidade para cada peça.
                  </li>
                </ul>
              }
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <ShortcutLink
                href="/predict"
                icon={Sparkles}
                title="Gerar uma predição"
                hint="Aplique tudo isso a um caso novo."
              />
              <ShortcutLink
                href="/compare"
                icon={GitCompare}
                title="Comparar ensaios"
                hint="Veja como cada parâmetro muda o resultado."
              />
            </div>
          </TabsContent>
        </Tabs>
      </PageShell>
    </DashboardLayout>
  )
}

function Section({
  chapter,
  title,
  children,
}: {
  chapter: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-md border border-foreground/15 bg-card">
      <div className="border-b border-foreground/10 px-5 py-4">
        <span className="label-caps-copper">{chapter}</span>
        <h2 className="mt-1 font-display text-2xl italic leading-tight">{title}</h2>
      </div>
      <div className="space-y-4 px-5 py-5">{children}</div>
    </section>
  )
}

function InfoCallout({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  body: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-copper/40 bg-copper-soft/40 p-4">
      <Icon className="mt-0.5 size-4 shrink-0 text-copper-deep" />
      <div className="space-y-1 text-sm">
        <p className="font-display text-base italic text-foreground">{title}</p>
        <div className="text-muted-foreground">{body}</div>
      </div>
    </div>
  )
}

function ParamCard({
  icon: Icon,
  title,
  hint,
  min,
  max,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  hint: string
  min: string
  max: string
}) {
  return (
    <div className="rounded-md border border-foreground/10 bg-background p-5">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md border border-foreground/15 text-copper-deep">
          <Icon className="size-4" />
        </span>
        <h4 className="font-display text-lg italic">{title}</h4>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <ParamBound label="Mínimo" value={min} />
        <ParamBound label="Máximo" value={max} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function ParamBound({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-foreground/10 bg-card px-3 py-2">
      <span className="label-caps">{label}</span>
      <span className="font-mono-data text-sm font-semibold tabular-nums">{value}</span>
    </div>
  )
}

function ResultCard({ title, range, body }: { title: string; range: string; body: string }) {
  return (
    <div className="rounded-md border border-foreground/10 bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-display text-lg italic">{title}</h4>
        <span className="shrink-0 rounded-full border border-copper bg-copper-soft px-2.5 py-0.5 font-mono-data text-[11px] tabular-nums text-copper-deep">
          {range}
        </span>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  )
}

function ShortcutLink({
  href,
  icon: Icon,
  title,
  hint,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  hint: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-md border border-foreground/15 bg-card p-4 transition-colors hover:border-copper hover:bg-copper-soft/30"
    >
      <span className="flex size-10 items-center justify-center rounded-md border border-foreground/15 bg-background text-copper-deep transition-colors group-hover:border-copper">
        <Icon className="size-4" />
      </span>
      <div className="flex-1">
        <p className="font-display text-base italic">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <span aria-hidden="true" className="font-mono-data text-sm text-foreground/40">
        →
      </span>
    </Link>
  )
}
