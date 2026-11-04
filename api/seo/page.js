// GET /:negocio  (y /:negocio?p=producto)
// Entrega la misma app, pero con el título, la descripción, la foto y los datos
// estructurados del negocio YA puestos en el <head>. Así Google y WhatsApp ven
// la información real del catálogo sin tener que ejecutar la app.
import { buildSeo, headTags } from '../../src/lib/seo.js'
import { isPremium } from '../../src/lib/billingCore.js'
import { loadCatalog, originOf, RESERVED } from '../_lib/seo.js'

const shells = new Map() // origen → { html, at }
async function fetchShell(origin) {
  const shell = shells.get(origin)
  if (shell?.html && Date.now() - shell.at < 5 * 60e3) return shell.html
  const r = await fetch(`${origin}/index.html`, { headers: { 'x-seo-shell': '1' } })
  if (!r.ok) throw new Error(`index.html ${r.status}`)
  const html = await r.text()
  // Debe ser nuestra app (no cualquier página)
  if (!html.includes('<div id="root">')) throw new Error('index.html inesperado')
  shells.set(origin, { html, at: Date.now() })
  return html
}
// Primero el index.html de ESTE despliegue (sus archivos /assets sí existen aquí);
// si no se puede, el del dominio principal.
async function indexHtml(req, origin) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase()
  const own = /^[a-z0-9.-]+(:\d+)?$/.test(host) ? `${/^(localhost|127\.0\.0\.1)/.test(host) ? 'http' : 'https'}://${host}` : ''
  const vercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
  let lastError
  for (const o of [...new Set([vercel, own, origin].filter(Boolean))]) {
    try { return await fetchShell(o) } catch (e) { lastError = e }
  }
  throw lastError
}

// Si no se pudo armar la página, se reintenta en la MISMA dirección (nunca se manda al inicio)
// (meta refresh: la política de seguridad no permite scripts en línea)
const RETRY_HTML = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
  + '<meta http-equiv="refresh" content="2"><title>Cargando…</title>'
  + '<p style="font-family:system-ui;text-align:center;margin-top:30vh">Cargando…</p>'

// Quita las etiquetas genéricas que se reemplazan
const strip = (html) => html
  .replace(/<title>[\s\S]*?<\/title>/i, '')
  .replace(/<meta\s+(name="description"|property="og:(title|description|type|image|url|locale|site_name)")[^>]*>\s*/gi, '')

export default async function handler(req, res) {
  const origin = originOf(req)
  let html
  try { html = await indexHtml(req, origin) } catch (e) {
    console.error('[seo] sin index.html', e)
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(503).send(RETRY_HTML)
  }
  const slug = String(req.query.slug || '').toLowerCase()
  const productId = req.query.p ? String(req.query.p) : ''
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // /super, /login, /admin… son páginas de la app, no catálogos
  if (RESERVED.includes(slug)) { res.setHeader('Cache-Control', 'no-store'); return res.status(200).send(html) }
  try {
    const data = await loadCatalog(slug)
    if (!data) {
      res.setHeader('Cache-Control', 'public, s-maxage=60')
      return res.status(404).send(html.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>'))
    }
    const full = buildSeo(data.tenant, data.products, { origin, slug, productId })
    // Básico: título, descripción y foto (para que el enlace se vea bien en WhatsApp).
    // Premium: además los datos estructurados del negocio y sus productos con precio.
    const seo = isPremium(data.tenant) ? full : { ...full, jsonLd: null }
    // La CDN de Vercel guarda la página 5 minutos y la renueva en segundo plano
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
    return res.status(200).send(strip(html).replace('</head>', `    ${headTags(seo)}\n  </head>`))
  } catch (e) {
    // Si Firestore falla, la app igual funciona (solo sin las etiquetas para Google)
    console.error('[seo]', e)
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).send(html)
  }
}
