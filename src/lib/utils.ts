import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ========================================
// UTILITÁRIOS DE ESTILO
// ========================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ========================================
// UTILITÁRIOS DE DATA
// ========================================

export function formatDate(date: Date | string, format: 'short' | 'long' | 'datetime' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('pt-BR')
    case 'long':
      return dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    case 'datetime':
      return dateObj.toLocaleString('pt-BR')
    default:
      return dateObj.toLocaleDateString('pt-BR')
  }
}

export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  return dateObj.toDateString() === today.toDateString()
}

export function isPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj < new Date()
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function getWeekDates(date: Date = new Date()): Date[] {
  const week = []
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() - date.getDay())

  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek)
    day.setDate(startOfWeek.getDate() + i)
    week.push(day)
  }

  return week
}

// ========================================
// UTILITÁRIOS DE FORMATAÇÃO
// ========================================

export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  
  return phone
}

export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '')
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

// ========================================
// UTILITÁRIOS DE VALIDAÇÃO
// ========================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) {
    return false
  }

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  
  let remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  
  remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  
  return remainder === parseInt(cleaned.charAt(10))
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 11
}

// ========================================
// UTILITÁRIOS DE TEXTO
// ========================================

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// ========================================
// UTILITÁRIOS DE ARRAY
// ========================================

export function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key])
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)]
}

export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// ========================================
// UTILITÁRIOS DE OBJETO
// ========================================

export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key]
    }
  })
  return result
}

export function isEmpty(value: any): boolean {
  if (value == null) return true
  if (Array.isArray(value) || typeof value === 'string') return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

// ========================================
// UTILITÁRIOS DE MAPA CORPORAL
// ========================================

export function coordinatesToPoint(x: number, y: number): string {
  return `(${x},${y})`
}

export function pointToCoordinates(point: string): { x: number; y: number } {
  const match = point.match(/\(([^,]+),([^)]+)\)/)
  if (!match) throw new Error('Formato de ponto inválido')
  
  return {
    x: parseFloat(match[1]),
    y: parseFloat(match[2])
  }
}

export function getPainColorByIntensity(intensity: number): string {
  if (intensity <= 2) return '#10b981' // Verde
  if (intensity <= 5) return '#f59e0b' // Amarelo/Laranja
  if (intensity <= 8) return '#dc2626' // Vermelho
  return '#991b1b' // Vermelho escuro
}

export function getPainLabelByIntensity(intensity: number): string {
  if (intensity === 0) return 'Sem dor'
  if (intensity <= 2) return 'Dor leve'
  if (intensity <= 5) return 'Dor moderada'
  if (intensity <= 8) return 'Dor intensa'
  return 'Dor insuportável'
}

// ========================================
// UTILITÁRIOS DE PERFORMANCE
// ========================================

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, wait)
    }
  }
}

// ========================================
// UTILITÁRIOS DE URL E NAVEGAÇÃO
// ========================================

export function createQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.set(key, String(value))
    }
  })
  
  return searchParams.toString()
}

export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString)
  const result: Record<string, string> = {}
  
  params.forEach((value, key) => {
    result[key] = value
  })
  
  return result
}

// ========================================
// UTILITÁRIOS DE ERRO
// ========================================

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Erro desconhecido'
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof Error && (
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('NetworkError')
  )
}

