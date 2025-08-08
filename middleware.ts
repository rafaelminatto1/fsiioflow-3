import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { USER_ROLES } from '@/constants'

// Configuração de rotas protegidas por role
const roleBasedRoutes = {
  [USER_ROLES.ADMIN]: [
    '/dashboard',
    '/patients',
    '/appointments',
    '/exercises',
    '/body-map',
    '/reports',
    '/settings',
    '/users'
  ],
  [USER_ROLES.FISIOTERAPEUTA]: [
    '/dashboard',
    '/patients',
    '/appointments',
    '/exercises',
    '/body-map',
    '/reports'
  ],
  [USER_ROLES.ESTAGIARIO]: [
    '/dashboard',
    '/patients',
    '/appointments',
    '/exercises'
  ],
  [USER_ROLES.PACIENTE]: [
    '/patient-portal',
    '/patient-portal/appointments',
    '/patient-portal/exercises',
    '/patient-portal/profile'
  ],
  [USER_ROLES.PARCEIRO]: [
    '/partner-portal',
    '/partner-portal/patients',
    '/partner-portal/exercises'
  ]
}

// Rotas públicas que não precisam de autenticação
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/auth/verify-request',
  '/auth/new-user',
  '/api/auth/callback/google',
  '/api/auth/signin',
  '/api/auth/signout',
  '/api/auth/session',
  '/api/auth/csrf',
  '/api/auth/providers'
]

// Rotas da API que precisam de autenticação
const protectedApiRoutes = [
  '/api/patients',
  '/api/appointments',
  '/api/exercises',
  '/api/body-map',
  '/api/sessions',
  '/api/prescriptions',
  '/api/dashboard',
  '/api/reports'
]

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Log para debug
    console.log(`Middleware: ${pathname} - Role: ${token?.role || 'No token'}`)

    // Se não há token e a rota não é pública, redirecionar para login
    if (!token && !publicRoutes.some(route => pathname.startsWith(route))) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Se há token, verificar permissões de role
    if (token) {
      const userRole = token.role as string
      const allowedRoutes = roleBasedRoutes[userRole as keyof typeof USER_ROLES] || []

      // Verificar se a rota atual é permitida para o role do usuário
      const isRouteAllowed = allowedRoutes.some(route => pathname.startsWith(route))

      // Se a rota não é permitida, redirecionar baseado no role
      if (!isRouteAllowed && !publicRoutes.some(route => pathname.startsWith(route))) {
        let redirectUrl = '/dashboard'

        // Redirecionamento específico por role
        switch (userRole) {
          case USER_ROLES.PACIENTE:
            redirectUrl = '/patient-portal'
            break
          case USER_ROLES.PARCEIRO:
            redirectUrl = '/partner-portal'
            break
          case USER_ROLES.ADMIN:
          case USER_ROLES.FISIOTERAPEUTA:
          case USER_ROLES.ESTAGIARIO:
          default:
            redirectUrl = '/dashboard'
            break
        }

        return NextResponse.redirect(new URL(redirectUrl, req.url))
      }

      // Verificar rotas da API
      if (pathname.startsWith('/api/')) {
        const isProtectedApi = protectedApiRoutes.some(route => pathname.startsWith(route))
        
        if (isProtectedApi) {
          // Verificar permissões específicas da API
          if (pathname.startsWith('/api/users') && userRole !== USER_ROLES.ADMIN) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
          }

          if (pathname.startsWith('/api/settings') && userRole !== USER_ROLES.ADMIN) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
          }

          if (pathname.startsWith('/api/reports') && 
              ![USER_ROLES.ADMIN, USER_ROLES.FISIOTERAPEUTA].includes(userRole as any)) {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
          }
        }
      }

      // Redirecionar usuários logados da página de login para o dashboard apropriado
      if (pathname === '/login') {
        switch (userRole) {
          case USER_ROLES.PACIENTE:
            return NextResponse.redirect(new URL('/patient-portal', req.url))
          case USER_ROLES.PARCEIRO:
            return NextResponse.redirect(new URL('/partner-portal', req.url))
          default:
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Permitir rotas públicas
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }

        // Exigir token para rotas protegidas
        return !!token
      }
    }
  }
)

// Configuração do matcher - rotas onde o middleware deve ser executado
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)'
  ]
}