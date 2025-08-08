// 🚨 EMERGENCY VITE CONFIGURATION - MAXIMUM PERFORMANCE
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';
  
  return {
    // 🚨 EMERGENCY: SWC for 10x faster compilation
    plugins: [
      react({
        // SWC optimizations
        jsxImportSource: '@emotion/react',
        plugins: [
          // Remove unused code
          ['@swc/plugin-remove-console', { exclude: ['error', 'warn'] }],
        ],
      }),
      
      // 🚨 EMERGENCY: Aggressive compression
      compression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
        deleteOriginFile: false,
      }),
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
        deleteOriginFile: false,
      }),
      
      // Bundle analyzer for optimization
      visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    
    // 🚨 EMERGENCY: Environment variables
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
      'process.env.REDIS_URL': JSON.stringify(env.REDIS_URL),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    
    // 🚨 EMERGENCY: Path resolution
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@components': path.resolve(__dirname, 'components'),
        '@services': path.resolve(__dirname, 'services'),
        '@hooks': path.resolve(__dirname, 'hooks'),
        '@lib': path.resolve(__dirname, 'lib'),
        '@pages': path.resolve(__dirname, 'pages'),
        '@types': path.resolve(__dirname, 'types.ts'),
      },
    },
    
    // 🚨 EMERGENCY: Build optimizations
    build: {
      // Target modern browsers for smaller bundles
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
      
      // 🚨 CRITICAL: Code splitting and chunk optimization
      rollupOptions: {
        output: {
          // Aggressive code splitting
          manualChunks: {
            // Vendor chunks
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['lucide-react'],
            'vendor-charts': ['recharts'],
            'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'vendor-http': ['axios'],
            'vendor-ai': ['@google/genai'],
            
            // App chunks by feature
            'app-dashboard': [
              './components/dashboard/KPICards',
              './components/dashboard/RevenueChart',
              './components/dashboard/PatientFlowChart',
              './hooks/useDashboardStats',
            ],
            'app-patients': [
              './components/PatientFormModal',
              './components/PatientTooltip',
              './hooks/usePatients',
              './services/optimized/patientService',
            ],
            'app-appointments': [
              './components/AppointmentCard',
              './components/AppointmentFormModal',
              './hooks/useAppointments',
              './services/optimized/appointmentService',
            ],
            'app-analytics': [
              './components/analytics/ClinicalAnalyticsDashboard',
              './hooks/useClinicalAnalytics',
            ],
          },
          
          // Optimize chunk file names
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId 
              ? chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '')
              : 'chunk';
            return `js/${facadeModuleId}-[hash].js`;
          },
          
          // Optimize asset file names
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `img/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext)) {
              return `css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
        
        // External dependencies (CDN)
        external: isProduction ? [] : [],
      },
      
      // 🚨 EMERGENCY: Minification settings
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.info'] : [],
          passes: 2,
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      },
      
      // 🚨 EMERGENCY: Bundle size limits
      chunkSizeWarningLimit: 500,
      
      // Source maps only in development
      sourcemap: !isProduction,
      
      // 🚨 EMERGENCY: CSS optimization
      cssCodeSplit: true,
      cssMinify: isProduction,
    },
    
    // 🚨 EMERGENCY: Development server optimizations
    server: {
      port: 5173,
      host: true,
      
      // HMR optimizations
      hmr: {
        overlay: false, // Disable error overlay for performance
      },
      
      // Proxy for API calls
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    
    // 🚨 EMERGENCY: Dependency optimization
    optimizeDeps: {
      // Pre-bundle heavy dependencies
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        'recharts',
        'lucide-react',
        '@google/genai',
      ],
      
      // Exclude problematic dependencies
      exclude: ['@vite/client', '@vite/env'],
      
      // Force optimization
      force: false,
    },
    
    // 🚨 EMERGENCY: ESBuild settings
    esbuild: {
      // Remove console logs in production
      drop: isProduction ? ['console', 'debugger'] : [],
      
      // JSX optimization
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      
      // Target modern JavaScript
      target: 'es2020',
    },
    
    // 🚨 EMERGENCY: Preview server settings
    preview: {
      port: 4173,
      host: true,
    },
    
    // 🚨 EMERGENCY: Worker settings
    worker: {
      format: 'es',
      plugins: [react()],
    },
    
    // 🚨 EMERGENCY: JSON optimization
    json: {
      namedExports: true,
      stringify: false,
    },
  };
});
