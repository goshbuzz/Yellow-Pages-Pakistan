import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cleanHost, buildRobots, buildSitemap } from './src/lib/seoFiles.js'

// Serve host-aware /robots.txt and /sitemap.xml in dev & preview, matching
// the Vercel serverless functions (api/robots.js, api/sitemap.js) so the
// SEO files always match the domain being requested — locally and in prod.
function hostAwareSeo() {
  const handler = (req, res, next) => {
    const path = (req.url || '').split('?')[0]
    if (path !== '/robots.txt' && path !== '/sitemap.xml') return next()
    const host = cleanHost(req.headers.host)
    res.setHeader('Content-Type', path === '/robots.txt' ? 'text/plain; charset=utf-8' : 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.setHeader('X-Robots-Tag', 'noindex')
    res.end(path === '/robots.txt' ? buildRobots(host) : buildSitemap(host))
  }
  return {
    name: 'host-aware-seo',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), hostAwareSeo()],
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    target: 'es2019',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react'],
        },
      },
    },
  },
})
