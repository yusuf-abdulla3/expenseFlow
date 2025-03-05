/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: path.resolve(__dirname, 'src/mock-canvas.js')
    }
    return config
  },
  transpilePackages: ['recharts', 'chart.js', 'react-chartjs-2'],
  serverExternalPackages: ['pdfjs-dist']
}

module.exports = nextConfig 