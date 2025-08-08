import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SessionProvider } from '@/components/providers/SessionProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FisioFlow - Gestão de Clínica de Fisioterapia',
  description: 'Sistema completo para gestão de clínicas de fisioterapia',
  themeColor: '#0ea5e9',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} bg-slate-50 antialiased`}>
        <SessionProvider>
          {children}
        </SessionProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, err => {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}


