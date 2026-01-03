'use client'

import type React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText,
  GitCompare,
  History,
  Home,
  Search,
  Settings,
  Sparkles,
  UploadCloud,
} from 'lucide-react'

import { NavUser } from '@/components/nav-user'
import { Label } from '@/components/ui/label'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string
    email: string
  }
}

const navigation = [
  {
    title: 'Fluxos',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: Home },
      { title: 'Nova Predição', href: '/predict', icon: Sparkles },
      { title: 'Histórico', href: '/history', icon: History },
      { title: 'Importar', href: '/import', icon: UploadCloud },
      { title: 'Comparar', href: '/compare', icon: GitCompare },
    ],
  },
  {
    title: 'Conteúdo',
    items: [{ title: 'Documentação', href: '/docs', icon: FileText }],
  },
  {
    title: 'Ajustes',
    items: [{ title: 'Configurações', href: '/settings', icon: Settings }],
  },
]

function SearchForm({ ...props }: React.ComponentProps<'form'>) {
  return (
    <form onSubmit={(event) => event.preventDefault()} {...props}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="sidebar-search" className="sr-only">
            Buscar
          </Label>
          <SidebarInput
            id="sidebar-search"
            placeholder="Buscar na plataforma..."
            className="pl-8"
          />
          <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  )
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-16"
            >
              <Link href="/dashboard">
                <div className="bg-white text-sidebar-primary-foreground flex aspect-square size-12 items-center justify-center rounded-lg">
                  <Image src="/logo.png" alt="ResistencIA" width={40} height={40} />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="text-sm font-semibold">ResistencIA</span>
                  <span className="text-xs text-sidebar-foreground/70">
                    Predição de Propriedades Mecânicas
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
