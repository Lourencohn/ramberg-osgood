import type React from 'react'
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { SettingsProvider } from '@/components/settings-provider'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans-app',
})

const _geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-display',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-app',
})

export const metadata: Metadata = {
  title: 'ResistencIA · Predição de Propriedades Mecânicas',
  description:
    'Sistema completo de previsão e análise de propriedades mecânicas para peças de PLA fabricadas por impressão 3D FDM',
  generator: 'v0.app',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${_geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SettingsProvider>{children}</SettingsProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
