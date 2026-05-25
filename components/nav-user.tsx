'use client'

import Link from 'next/link'
import { LogOut, Settings } from 'lucide-react'

import { logoutAction } from '@/lib/auth-actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type NavUserProps = {
  user: {
    name: string
    email: string
    avatar?: string | null
  }
  // Compact = only avatar, used inside the rail.
  compact?: boolean
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function NavUser({ user, compact = false }: NavUserProps) {
  const initials = getInitials(user.name)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <button
            type="button"
            aria-label={`Conta de ${user.name}`}
            className="flex size-10 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
          >
            <Avatar className="size-8 rounded-md border border-foreground/15">
              {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
              <AvatarFallback className="rounded-md bg-copper-soft font-mono-data text-xs text-copper-deep">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        ) : (
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md border border-foreground/15 bg-background p-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper"
          >
            <Avatar className="size-9 rounded-md border border-foreground/15">
              {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
              <AvatarFallback className="rounded-md bg-copper-soft font-mono-data text-xs text-copper-deep">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate font-mono-data text-[11px] text-muted-foreground">
                {user.email}
              </span>
            </div>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-60 rounded-md border border-foreground/15"
        side="right"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-9 rounded-md border border-foreground/15">
              {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
              <AvatarFallback className="rounded-md bg-copper-soft font-mono-data text-xs text-copper-deep">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate font-mono-data text-[11px] text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="size-4" />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={logoutAction} className="w-full">
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut className="size-4" />
              Sair
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
