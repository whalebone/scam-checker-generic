import { defineConfig, loadEnv } from 'vite'
import { BRAND } from './src/brand.js'

// Link previews need an absolute image URL. Netlify sets URL during builds; locally it stays relative.
const siteUrl = process.env.URL ?? ''

// The brand's colours as CSS variables, written into the page's head so the first paint already has them.
const brandStyle = `<style>:root { ${Object.entries({ ...BRAND.colors, gradient: BRAND.gradient })
  .map(([name, value]) => `--${name}: ${value};`)
  .join(' ')} }</style>`

export default defineConfig(({ mode }) => {
  // API_PROXY (in .env.development.local) passes /api on to the backend, so the browser talks to one origin and needs no CORS.
  const { API_PROXY } = loadEnv(mode, process.cwd(), '')
  return {
    server: {
      port: 5190, // also set in runapp.bat and shutdown.bat; the project this was forked from keeps 5180
      strictPort: true, // fail instead of silently switching to another port
      proxy: API_PROXY ? { '/api': { target: API_PROXY, changeOrigin: true, rewrite: (path) => path.replace(/^\/api/, '') } } : undefined,
    },
    plugins: [
      {
        name: 'brand',
        transformIndexHtml: (html) =>
          html
            .replaceAll('__SITE_URL__', siteUrl)
            .replaceAll('__THEME_COLOR__', BRAND.colors['brand-dark'])
            .replace('</head>', `${brandStyle}\n  </head>`),
      },
    ],
  }
})
