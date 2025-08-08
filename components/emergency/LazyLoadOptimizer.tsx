// 🚨 EMERGENCY LAZY LOADING OPTIMIZER
// Aggressive code splitting to reduce initial bundle size immediately

import React, { Suspense, lazy, Component, ErrorInfo, ReactNode } from 'react';

// 🚨 EMERGENCY: Loading fallback with performance monitoring
const EmergencyLoadingFallback: React.FC<{ componentName?: string }> = ({ componentName }) => (
  <div className="flex items-center justify-center min-h-[200px] bg-gray-50 rounded-lg">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-sm text-gray-600">
        {componentName ? `Loading ${componentName}...` : 'Loading...'}
      </p>
    </div>
  </div>
);

// 🚨 EMERGENCY: Error boundary for lazy components
class LazyComponentErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Lazy component error:', error, errorInfo);
    
    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // window.reportError?.(error, 'lazy-component');
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-[200px] bg-red-50 rounded-lg border border-red-200">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-2">⚠️</div>
            <p className="text-red-800 font-medium">Failed to load component</p>
            <p className="text-red-600 text-sm mt-1">Please refresh the page</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 🚨 EMERGENCY: Lazy wrapper with preloading
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  componentName: string,
  preload: boolean = false
) => {
  const LazyComponent = lazy(importFunc);
  
  // Preload if requested
  if (preload && typeof window !== 'undefined') {
    setTimeout(() => {
      importFunc().catch(console.error);
    }, 100);
  }
  
  const WrappedComponent = (props: React.ComponentProps<T>) => (
    <LazyComponentErrorBoundary>
      <Suspense fallback={<EmergencyLoadingFallback componentName={componentName} />}>
        <LazyComponent {...props} />
      </Suspense>
    </LazyComponentErrorBoundary>
  );
  
  WrappedComponent.displayName = `Lazy(${componentName})`;
  return WrappedComponent;
};

// 🚨 EMERGENCY: Critical lazy components (preloaded)
export const LazyDashboard = createLazyComponent(
  () => import('../../pages/DashboardPage'),
  'Dashboard',
  true // Preload this critical component
);

export const LazyPatientList = createLazyComponent(
  () => import('../../pages/PatientListPage'),
  'PatientList',
  true // Preload this critical component
);

export const LazyAgenda = createLazyComponent(
  () => import('../../pages/AgendaPage'),
  'Agenda',
  true // Preload this critical component
);

// 🚨 EMERGENCY: Secondary lazy components (loaded on demand)
export const LazyPatientDetail = createLazyComponent(
  () => import('../../pages/PatientDetailPage'),
  'PatientDetail'
);

export const LazyReports = createLazyComponent(
  () => import('../../pages/ReportsPage'),
  'Reports'
);

export const LazySettings = createLazyComponent(
  () => import('../../pages/SettingsPage'),
  'Settings'
);

export const LazyTeleconsulta = createLazyComponent(
  () => import('../../pages/TeleconsultaPage'),
  'Teleconsulta'
);

export const LazyBodyMap = createLazyComponent(
  () => import('../../pages/BodyMapPage'),
  'BodyMap'
);

// 🚨 EMERGENCY: Heavy modals (loaded on demand)
export const LazyPatientFormModal = createLazyComponent(
  () => import('../../components/PatientFormModal'),
  'PatientFormModal'
);

export const LazyAppointmentFormModal = createLazyComponent(
  () => import('../../components/AppointmentFormModal'),
  'AppointmentFormModal'
);

export const LazyNewSoapNoteModal = createLazyComponent(
  () => import('../../components/NewSoapNoteModal'),
  'NewSoapNoteModal'
);

// 🚨 EMERGENCY: Chart components (heavy libraries)
export const LazyRevenueChart = createLazyComponent(
  () => import('../../components/dashboard/RevenueChart'),
  'RevenueChart'
);

export const LazyPatientFlowChart = createLazyComponent(
  () => import('../../components/dashboard/PatientFlowChart'),
  'PatientFlowChart'
);

export const LazyMetricEvolutionChart = createLazyComponent(
  () => import('../../components/MetricEvolutionChart'),
  'MetricEvolutionChart'
);

// 🚨 EMERGENCY: Preload critical components immediately
export const preloadCriticalComponents = () => {
  if (typeof window === 'undefined') return;
  
  console.log('🚀 Preloading critical components...');
  
  // Preload in order of importance
  const preloadTasks = [
    () => import('../../pages/DashboardPage'),
    () => import('../../pages/PatientListPage'),
    () => import('../../pages/AgendaPage'),
    () => import('../../components/dashboard/RevenueChart'),
    () => import('../../components/dashboard/PatientFlowChart'),
  ];
  
  preloadTasks.forEach((task, index) => {
    setTimeout(() => {
      task().catch(error => {
        console.warn(`Failed to preload component ${index}:`, error);
      });
    }, index * 200); // Stagger preloading to avoid blocking
  });
};

// 🚨 EMERGENCY: Bundle size monitoring
export const monitorBundleSize = () => {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;
  
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      if (entry.name.includes('chunk') && (entry as any).transferSize) {
        console.log(`📦 Bundle chunk loaded: ${entry.name} (${(entry as any).transferSize} bytes)`);
      }
    });
  });
  
  observer.observe({ entryTypes: ['resource'] });
};

// 🚨 EMERGENCY: Auto-preload on idle
export const preloadOnIdle = () => {
  if (typeof window === 'undefined') return;
  
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      preloadCriticalComponents();
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(preloadCriticalComponents, 2000);
  }
};

// Start preloading when module loads
if (typeof window !== 'undefined') {
  preloadOnIdle();
  monitorBundleSize();
}

export default {
  LazyDashboard,
  LazyPatientList,
  LazyAgenda,
  LazyPatientDetail,
  LazyReports,
  LazySettings,
  LazyTeleconsulta,
  LazyBodyMap,
  LazyPatientFormModal,
  LazyAppointmentFormModal,
  LazyNewSoapNoteModal,
  LazyRevenueChart,
  LazyPatientFlowChart,
  LazyMetricEvolutionChart,
  preloadCriticalComponents,
  preloadOnIdle,
};
