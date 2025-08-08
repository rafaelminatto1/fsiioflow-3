
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import { DataProvider } from './contexts/DataContext';

// 🚨 EMERGENCY: Service Worker Registration
import { registerEmergencyServiceWorker, EmergencyPerformanceMonitor } from './components/emergency/ServiceWorkerRegistration';

// Re-rendering the application to refresh the preview.
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// 🚨 EMERGENCY: Register service worker immediately
registerEmergencyServiceWorker();

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <Suspense fallback={<div className="p-6 text-slate-500">Carregando aplicação...</div>}>
              <EmergencyPerformanceMonitor />
              <App />
            </Suspense>
          </DataProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);