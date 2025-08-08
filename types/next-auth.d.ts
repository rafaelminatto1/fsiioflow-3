import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      crefito?: string
      phone?: string
      avatar?: string
      patientProfile?: any
      partnerProfile?: any
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string
    crefito?: string
    phone?: string
    avatar?: string
    patientProfile?: any
    partnerProfile?: any
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: string
    crefito?: string
    phone?: string
    avatar?: string
    patientProfile?: any
    partnerProfile?: any
  }
}