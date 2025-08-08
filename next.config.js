/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações de produção
  reactStrictMode: true,
  swcMinify: true,
  
  // Otimizações de performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  // Configurações de imagem
  images: {
    domains: [
      'localhost',
      'example.com',
      // Adicionar domínios de CDN conforme necessário
    ],
    formats: ['image/webp', 'image/avif']
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self';"
          }
        ]
      }
    ]
  },
  
  // Configurações experimentais
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
    optimizeCss: true
  },
  
  // Bundle analyzer (apenas em desenvolvimento)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: '../bundle-analyzer.html'
          })
        )
      }
      return config
    }
  })
}

module.exports = nextConfig