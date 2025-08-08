import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { USER_ROLES } from '@/constants'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Provider de credenciais (email/senha)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios')
        }

        try {
          // Buscar usuário no banco
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
              isActive: true,
              deletedAt: null
            },
            include: {
              patientProfile: true,
              partnerProfile: true
            }
          })

          if (!user) {
            throw new Error('Usuário não encontrado')
          }

          // Verificar senha
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          
          if (!isValidPassword) {
            throw new Error('Senha incorreta')
          }

          // Retornar dados do usuário
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            crefito: user.crefito,
            phone: user.phone,
            avatar: user.avatar,
            patientProfile: user.patientProfile,
            partnerProfile: user.partnerProfile
          }
        } catch (error) {
          console.error('Erro na autenticação:', error)
          throw new Error('Erro na autenticação')
        }
      }
    }),

    // Provider do Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
    updateAge: 24 * 60 * 60 // 24 horas
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60 // 30 dias
  },

  callbacks: {
    // Callback JWT - executado sempre que um JWT é criado, atualizado ou acessado
    async jwt({ token, user, account }) {
      // Primeira vez fazendo login
      if (user) {
        token.role = user.role
        token.crefito = user.crefito
        token.phone = user.phone
        token.avatar = user.avatar
        token.patientProfile = user.patientProfile
        token.partnerProfile = user.partnerProfile
      }

      // Login com Google
      if (account?.provider === 'google' && user) {
        try {
          // Verificar se usuário já existe
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: {
              patientProfile: true,
              partnerProfile: true
            }
          })

          if (existingUser) {
            // Atualizar dados do Google
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: user.name!,
                avatar: user.image
              }
            })

            token.role = existingUser.role
            token.crefito = existingUser.crefito
            token.phone = existingUser.phone
            token.patientProfile = existingUser.patientProfile
            token.partnerProfile = existingUser.partnerProfile
          } else {
            // Criar novo usuário (role padrão: PACIENTE)
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name!,
                password: '', // Senha vazia para login com Google
                role: 'PACIENTE',
                avatar: user.image
              },
              include: {
                patientProfile: true,
                partnerProfile: true
              }
            })

            token.role = newUser.role
            token.crefito = newUser.crefito
            token.phone = newUser.phone
            token.patientProfile = newUser.patientProfile
            token.partnerProfile = newUser.partnerProfile
          }
        } catch (error) {
          console.error('Erro ao processar login com Google:', error)
        }
      }

      return token
    },

    // Callback Session - executado sempre que uma sessão é verificada
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.crefito = token.crefito as string
        session.user.phone = token.phone as string
        session.user.avatar = token.avatar as string
        session.user.patientProfile = token.patientProfile as any
        session.user.partnerProfile = token.partnerProfile as any
      }

      return session
    },

    // Callback SignIn - controla se o usuário pode fazer login
    async signIn({ user, account, profile }) {
      // Permitir login com credenciais
      if (account?.provider === 'credentials') {
        return true
      }

      // Permitir login com Google apenas para emails verificados
      if (account?.provider === 'google') {
        return profile?.email_verified === true
      }

      return false
    },

    // Callback Redirect - controla para onde redirecionar após login/logout
    async redirect({ url, baseUrl }) {
      // Permite redirecionamento relativo
      if (url.startsWith('/')) return `${baseUrl}${url}`
      
      // Permite redirecionamento para o mesmo host
      if (new URL(url).origin === baseUrl) return url
      
      // Fallback para dashboard
      return `${baseUrl}/dashboard`
    }
  },

  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user'
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`Login realizado: ${user.email} via ${account?.provider}`)
    },

    async signOut({ session, token }) {
      console.log(`Logout realizado: ${session?.user?.email || token?.email}`)
    },

    async createUser({ user }) {
      console.log(`Novo usuário criado: ${user.email}`)
    }
  },

  debug: process.env.NODE_ENV === 'development'
}

// Função para hash de senha
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// Função para verificar senha
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

// Função para verificar permissões
export function hasPermission(userRole: string, permission: string): boolean {
  const rolePermissions = {
    [USER_ROLES.ADMIN]: [
      'manage_users',
      'manage_patients',
      'manage_appointments',
      'manage_exercises',
      'view_reports',
      'manage_clinic_settings'
    ],
    [USER_ROLES.FISIOTERAPEUTA]: [
      'manage_patients',
      'manage_appointments',
      'manage_exercises',
      'create_prescriptions',
      'view_patient_reports'
    ],
    [USER_ROLES.ESTAGIARIO]: [
      'view_patients',
      'create_appointments',
      'view_exercises'
    ],
    [USER_ROLES.PACIENTE]: [
      'view_own_data',
      'view_own_appointments',
      'view_own_exercises'
    ],
    [USER_ROLES.PARCEIRO]: [
      'view_shared_patients',
      'create_exercise_recommendations'
    ]
  }

  const permissions = rolePermissions[userRole as keyof typeof USER_ROLES] || []
  return permissions.includes(permission)
}

// Função para verificar se usuário é admin
export function isAdmin(userRole: string): boolean {
  return userRole === USER_ROLES.ADMIN
}

// Função para verificar se usuário é fisioterapeuta
export function isPhysiotherapist(userRole: string): boolean {
  return userRole === USER_ROLES.FISIOTERAPEUTA
}

// Função para verificar se usuário é paciente
export function isPatient(userRole: string): boolean {
  return userRole === USER_ROLES.PACIENTE
}
