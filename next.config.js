/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: path.resolve(__dirname, 'src/mock-canvas.js')
    }
    // Add WebSocket packages to externals to prevent errors
    config.externals = [...(config.externals || []), { 
      'bufferutil': 'bufferutil',
      'utf-8-validate': 'utf-8-validate',
    }]
    
    // Remove the PDF.js worker configuration since we're using pdf-parse
    // which handles its own worker
    config.module.rules = config.module.rules.filter(rule => {
      // Filter out any rules related to pdf.worker.js
      if (rule.test && rule.test.toString().includes('pdf.worker')) {
        return false;
      }
      return true;
    });
    
    return config
  },
  transpilePackages: ['pdfjs-dist'],
  // Add redirects to handle routing between App Router and Pages Router
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  }
}

module.exports = nextConfig 