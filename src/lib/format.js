// Formatos y enlaces reutilizables

export const formatPrice = (price) => {
  const n = Number(price) || 0
  return `$\u00A0${n.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`
}

// Solo dígitos; si es un celular colombiano de 10 dígitos le agrega el 57
export const normalizePhone = (raw = '') => {
  const d = String(raw).replace(/\D/g, '')
  if (d.length === 10 && d.startsWith('3')) return `57${d}`
  return d
}

// Se usa api.whatsapp.com y no wa.me: la redirección de wa.me daña los emojis
// (llegan como «�» en WhatsApp Web / escritorio).
export const waLink = (phone, text = '') => {
  const n = normalizePhone(phone)
  return `https://api.whatsapp.com/send?phone=${n}${text ? `&text=${encodeURIComponent(text)}` : ''}`
}

export const openWhatsApp = (phone, text) => window.open(waLink(phone, text), '_blank', 'noopener')

// "Flores Ana" → "flores-ana"
export const slugify = (s = '') =>
  s.toString().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)

// Contraseña temporal legible (sin caracteres confusos)
export const tempPassword = () => {
  const c = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let s = ''
  const rnd = crypto.getRandomValues(new Uint32Array(10))
  for (const r of rnd) s += c[r % c.length]
  return s
}

// Lee/escribe valores anidados: getPath(obj, 'a.b.0.c')
export const getPath = (obj, path) =>
  path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)

export const setPath = (obj, path, value, seed = {}) => {
  const next = structuredClone(obj || {})
  const keys = path.split('.')
  if (next[keys[0]] === undefined && seed[keys[0]] !== undefined) next[keys[0]] = structuredClone(seed[keys[0]])
  let o = next
  keys.slice(0, -1).forEach((k, i) => {
    if (o[k] == null || typeof o[k] !== 'object') o[k] = /^\d+$/.test(keys[i + 1]) ? [] : {}
    o = o[k]
  })
  o[keys[keys.length - 1]] = value
  return next
}
