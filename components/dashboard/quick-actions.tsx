import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, GitCompare, FileText, Download, ArrowRight } from "lucide-react"
import Link from "next/link"

const actions = [
  {
    title: "Nova Predição",
    description: "Iniciar simulação de propriedades",
    icon: Sparkles,
    href: "/predict",
    variant: "default" as const,
    gradient: "from-primary to-primary/80",
  },
  {
    title: "Comparar Resultados",
    description: "Análise lado a lado",
    icon: GitCompare,
    href: "/compare",
    variant: "outline" as const,
  },
  {
    title: "Documentação",
    description: "Guias e referências técnicas",
    icon: FileText,
    href: "/docs",
    variant: "outline" as const,
  },
  {
    title: "Exportar Dados",
    description: "Download de relatórios",
    icon: Download,
    href: "/history",
    variant: "outline" as const,
  },
]

export function QuickActions() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        <CardDescription>Acesso às funcionalidades principais</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3">
        {actions.map((action, index) => (
          <Link
            key={action.title}
            href={action.href}
            className={`
              group flex items-center gap-4 rounded-xl p-4 transition-all duration-200
              ${index === 0
                ? "bg-gradient-to-r from-foreground to-foreground/90 text-background shadow-md hover:shadow-lg hover:scale-[1.02]"
                : "border border-border bg-card hover:border-foreground/20 hover:bg-muted/50 hover:shadow-sm"
              }
            `}
          >
            <div className={`
              flex size-10 items-center justify-center rounded-lg transition-colors
              ${index === 0
                ? "bg-background/20"
                : "bg-muted group-hover:bg-foreground/10"
              }
            `}>
              <action.icon className={`size-5 ${index === 0 ? "text-background" : "text-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${index === 0 ? "text-background" : "text-foreground"}`}>
                {action.title}
              </p>
              <p className={`text-xs mt-0.5 ${index === 0 ? "text-background/70" : "text-muted-foreground"}`}>
                {action.description}
              </p>
            </div>
            <ArrowRight className={`size-4 transition-transform group-hover:translate-x-1 ${index === 0 ? "text-background/70" : "text-muted-foreground"}`} />
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
