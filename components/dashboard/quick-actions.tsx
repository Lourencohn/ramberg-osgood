import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, GitCompare, FileText, Download } from "lucide-react"
import Link from "next/link"

const actions = [
  {
    title: "Nova Predição",
    description: "Iniciar nova simulação",
    icon: Sparkles,
    href: "/predict",
    variant: "default" as const,
  },
  {
    title: "Comparar Resultados",
    description: "Análise comparativa",
    icon: GitCompare,
    href: "/compare",
    variant: "outline" as const,
  },
  {
    title: "Documentação",
    description: "Guias e referências",
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
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
        <CardDescription>Acesso rápido às funcionalidades principais</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {actions.map((action) => (
          <Button key={action.title} variant={action.variant} className="justify-start" asChild>
            <Link href={action.href}>
              <action.icon className="mr-2 size-4" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{action.title}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
