// 🚨 EMERGENCY LAZY LOADING - REDUCE INITIAL BUNDLE SIZE
import React, { Suspense, lazy } from 'react';

// 🚨 EMERGENCY: Lazy load heavy components
export const LazyDashboardPage = lazy(() => 
  import('../pages/DashboardPage').then(module => ({
    default: module.default
  }))
);

export const LazyPatientListPage = lazy(() => 
  import('../pages/PatientListPage').then(module => ({
    default: module.default
  }))
);

export const LazyPatientDetailPage = lazy(() => 
  import('../pages/PatientDetailPage').then(module => ({
    default: module.default
  }))
);

export const LazyAgendaPage = lazy(() => 
  import('../pages/AgendaPage').then(module => ({
    default: module.default
  }))
);

export const LazyClinicalAnalyticsPage = lazy(() => 
  import('../pages/ClinicalAnalyticsPage').then(module => ({
    default: module.default
  }))
);

export const LazyFinancialPage = lazy(() => 
  import('../pages/FinancialPage').then(module => ({
    default: module.default
  }))
);

export const LazyReportsPage = lazy(() => 
  import('../pages/ReportsPage').then(module => ({
    default: module.default
  }))
);

export const LazyExerciseLibraryPage = lazy(() => 
  import('../pages/ExerciseLibraryPage').then(module => ({
    default: module.default
  }))
);

// 🚨 EMERGENCY: Lazy load heavy components
export const LazyRevenueChart = lazy(() => 
  import('../components/dashboard/RevenueChart').then(module => ({
    default: module.default
  }))
);

export const LazyPatientFlowChart = lazy(() => 
  import('../components/dashboard/PatientFlowChart').then(module => ({
    default: module.default
  }))
);

export const LazyTeamProductivityChart = lazy(() => 
  import('../components/dashboard/TeamProductivityChart').then(module => ({
    default: module.default
  }))
);

export const LazyAppointmentHeatmap = lazy(() => 
  import('../components/dashboard/AppointmentHeatmap').then(module => ({
    default: module.default
  }))
);

export const LazyClinicalAnalyticsDashboard = lazy(() => 
  import('../components/analytics/ClinicalAnalyticsDashboard').then(module => ({
    default: module.default
  }))
);

export const LazyAiAssistant = lazy(() => 
  import('../components/AiAssistant').then(module => ({
    default: module.default
  }))
);

export const LazyInteractiveBodyMap = lazy(() => 
  import('../components/InteractiveBodyMap').then(module => ({
    default: module.default
  }))
);

// 🚨 EMERGENCY: Loading fallback component
export const EmergencyLoadingFallback: React.FC<{ 
  message?: string;
  minHeight?: string;
}> = ({ message = 'Carregando...', minHeight = '200px' }) => (
  <div 
    className="flex items-center justify-center w-full bg-gray-50 rounded-lg"
    style={{ minHeight }}
  >
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  </div>
);

// 🚨 EMERGENCY: Error boundary for lazy components
export class LazyComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Emergency: Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium">Erro ao carregar componente</h3>
          <p className="text-red-600 text-sm mt-1">
            {this.state.error?.message || 'Componente não pôde ser carregado'}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 🚨 EMERGENCY: Wrapper component with suspense and error boundary
export const LazyWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  minHeight?: string;
}> = ({ 
  children, 
  fallback, 
  errorFallback, 
  minHeight = '200px' 
}) => (
  <LazyComponentErrorBoundary fallback={errorFallback}>
    <Suspense fallback={fallback || <EmergencyLoadingFallback minHeight={minHeight} />}>
      {children}
    </Suspense>
  </LazyComponentErrorBoundary>
);

// 🚨 EMERGENCY: Preload critical components
export const preloadCriticalComponents = () => {
  // Preload dashboard components
  import('../pages/DashboardPage');
  import('../components/dashboard/RevenueChart');
  import('../components/dashboard/PatientFlowChart');
  
  // Preload patient components
  import('../pages/PatientListPage');
  import('../components/PatientFormModal');
  
  // Preload appointment components
  import('../pages/AgendaPage');
  import('../components/AppointmentFormModal');
};

// 🚨 EMERGENCY: Component size monitoring
export const logComponentSize = (componentName: string) => {
  if (process.env.NODE_ENV === 'development') {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      if (loadTime > 100) {
        console.warn(`🚨 Emergency: Slow component load - ${componentName}: ${loadTime.toFixed(2)}ms`);
      } else {
        console.log(`✅ Component loaded - ${componentName}: ${loadTime.toFixed(2)}ms`);
      }
    };
  }
  
  return () => {};
};

// 🚨 EMERGENCY: Dynamic import with retry
export const dynamicImportWithRetry = async (
  importFn: () => Promise<any>,
  retries: number = 3,
  delay: number = 1000
): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await importFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      console.warn(`🚨 Emergency: Dynamic import failed (attempt ${i + 1}/${retries}), retrying...`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

// 🚨 EMERGENCY: Component registry for tracking
const componentRegistry = new Map<string, {
  loadTime: number;
  errorCount: number;
  lastError?: string;
}>();

export const trackComponentPerformance = (componentName: string) => {
  const startTime = performance.now();
  
  return {
    onLoad: () => {
      const loadTime = performance.now() - startTime;
      const existing = componentRegistry.get(componentName) || { loadTime: 0, errorCount: 0 };
      
      componentRegistry.set(componentName, {
        ...existing,
        loadTime
      });
      
      if (loadTime > 200) {
        console.warn(`🚨 Emergency: Slow component - ${componentName}: ${loadTime.toFixed(2)}ms`);
      }
    },
    
    onError: (error: Error) => {
      const existing = componentRegistry.get(componentName) || { loadTime: 0, errorCount: 0 };
      
      componentRegistry.set(componentName, {
        ...existing,
        errorCount: existing.errorCount + 1,
        lastError: error.message
      });
      
      console.error(`🚨 Emergency: Component error - ${componentName}:`, error);
    }
  };
};

// 🚨 EMERGENCY: Get performance stats
export const getComponentPerformanceStats = () => {
  const stats = Array.from(componentRegistry.entries()).map(([name, data]) => ({
    name,
    ...data
  }));
  
  return {
    components: stats,
    totalComponents: stats.length,
    slowComponents: stats.filter(c => c.loadTime > 200).length,
    errorComponents: stats.filter(c => c.errorCount > 0).length,
    averageLoadTime: stats.reduce((sum, c) => sum + c.loadTime, 0) / stats.length || 0
  };
};
