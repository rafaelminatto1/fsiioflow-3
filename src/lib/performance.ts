// Utilitários de performance e otimização

// Cache em memória simples
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

export function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutos
): Promise<T> {
  const cached = cache.get(key)
  
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return Promise.resolve(cached.data)
  }
  
  return fetcher().then(data => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
    return data
  })
}

export function clearCache(pattern?: string) {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    cache.clear()
  }
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Lazy loading helper
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return React.lazy(importFunc)
}

// Performance monitor
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }
  
  startTimer(name: string): () => void {
    const start = performance.now()
    
    return () => {
      const duration = performance.now() - start
      this.recordMetric(name, duration)
    }
  }
  
  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(value)
    
    // Manter apenas os últimos 100 valores
    if (values.length > 100) {
      values.shift()
    }
  }
  
  getMetrics(name: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return null
    
    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    }
  }
  
  getAllMetrics(): Record<string, ReturnType<typeof this.getMetrics>> {
    const result: Record<string, any> = {}
    
    for (const [name] of this.metrics) {
      result[name] = this.getMetrics(name)
    }
    
    return result
  }
}

// Error boundary helper
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  ErrorFallback?: React.ComponentType<{ error: Error }>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={ErrorFallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback
      
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} />
      }
      
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-800 font-medium">Algo deu errado</h2>
          <p className="text-red-600 text-sm mt-1">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
        </div>
      )
    }
    
    return this.props.children
  }
}

// Bundle size analyzer helper
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Bundle analysis available at: /bundle-analyzer.html')
  }
}
