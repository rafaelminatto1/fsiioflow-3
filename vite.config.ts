import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'es2022',
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: {
              recharts: ['recharts'],
              genai: ['@google/genai'],
            }
          }
        }
      },
      esbuild: {
        drop: ['console', 'debugger']
      },
      optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom'],
        exclude: ['@google/genai', 'html2pdf.js']
      }
    };
});
