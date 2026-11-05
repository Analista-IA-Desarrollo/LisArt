// ─────────────────────────────────────────────────────────────
// Mensajes de WhatsApp de los catálogos (pedido y preguntas).
//
// WhatsApp NO permite adjuntar fotos desde un enlace wa.me: solo texto.
// Lo que sí hace es mostrar una VISTA PREVIA (foto + título + precio) del
// PRIMER enlace del mensaje. Por eso cada producto va con el enlace a su
// ficha (…/negocio?p=id): esa página trae su foto liviana (og:image) y el
// negocio ve la imagen del producto dentro del chat.
// ─────────────────────────────────────────────────────────────
import { formatPrice } from './format.js'

// Solo símbolos «clásicos» (✨ ♡ ✦ ➤ ★ ✓ ⏰ ✉): se ven bien en TODOS los celulares y en
// WhatsApp Web. Los emojis nuevos (👋 🛒 💰…) a veces llegan como «�».
const LINE = '┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈'
const MAX_LINKS = 8 // mensajes cortos: enlaces solo para los primeros productos
const DEFAULT_NAMES = ['nuevo producto', '']

// Enlace público a la ficha de un producto (la página del servidor pone su foto)
export const productUrl = (slug, id, origin = typeof window !== 'undefined' ? window.location.origin : '') =>
  `${origin}/${slug}?p=${encodeURIComponent(id)}`

export const catalogUrlOf = (slug, origin = typeof window !== 'undefined' ? window.location.origin : '') => `${origin}/${slug}`

const isCombo = (i) => String(i?.id || '').startsWith('combo:')
const optsOf = (i) => [i.size && `Talla ${i.size}`, i.color && `Color ${i.color}`].filter(Boolean).join(' · ')

// Código corto para que cliente y negocio hablen del mismo pedido (#K7Q2)
export function orderCode() {
  const c = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const r = (typeof crypto !== 'undefined' && crypto.getRandomValues) ? crypto.getRandomValues(new Uint32Array(4)) : [1, 2, 3, 4].map(() => Math.random() * 1e9)
  return Array.from(r, x => c[x % c.length]).join('')
}

// Nombre presentable (si el negocio no le puso nombre al producto)
const nameOf = (i, n) => (DEFAULT_NAMES.includes(String(i?.name || '').trim().toLowerCase()) ? `Producto ${n}` : String(i.name).trim())
const priceOf = (v) => (Number(v) > 0 ? formatPrice(v) : 'precio a convenir')

/**
 * Pedido completo, bonito y fácil de leer en el chat del negocio.
 * { brand, slug, items, total, discount, finalTotal, rewards, info, freeShipping, code }
 */
export function orderMessage({ brand, slug, items = [], total = 0, discount = 0, finalTotal = total, rewards = [], info = {}, freeShipping = false, code = orderCode() }) {
  const units = items.reduce((s, i) => s + (Number(i.qty) || 0), 0)
  const toQuote = items.some(i => !(Number(i.price) > 0)) // algún producto sin precio
  let links = 0
  const lines = items.flatMap((i, idx) => {
    const n = idx + 1
    const opts = optsOf(i)
    const qty = Number(i.qty) || 1
    const out = [`*${n}. ${nameOf(i, n)}*`]
    if (opts) out.push(`     ${opts}`)
    out.push(Number(i.price) > 0
      ? (qty > 1 ? `     ${qty} × ${formatPrice(i.price)} ➤ *${formatPrice(i.price * qty)}*` : `     ${qty} und ➤ *${formatPrice(i.price)}*`)
      : `     ${qty} und ➤ _${priceOf(0)}_`)
    if (i.detail) out.push(`     Incluye: ${i.detail}`)
    if (slug && !isCombo(i) && links < MAX_LINKS) { out.push(`     Ver foto: ${productUrl(slug, i.id)}`); links++ }
    return [...out, '']
  })
  if (lines.at(-1) === '') lines.pop()

  const totalLine = finalTotal > 0
    ? `★ *TOTAL: ${formatPrice(finalTotal)}*${toQuote ? ' _+ lo que esté por cotizar_' : ''}`
    : '★ *TOTAL:* _por cotizar_'

  const extra = [
    info.name?.trim() && `♡ *A nombre de:* ${info.name.trim()}`,
    info.date?.trim() && `⏰ *Para cuándo:* ${info.date.trim()}`,
    info.note?.trim() && `✉ *Detalles:* ${info.note.trim()}`,
  ].filter(Boolean)

  return [
    `✨ ¡Hola, *${brand.name}*! ✨`,
    'Vi su catálogo y quiero hacer este pedido ♡',
    '',
    `✦ *PEDIDO #${code}* · ${units} ${units === 1 ? 'producto' : 'productos'}`,
    LINE,
    ...lines,
    LINE,
    ...(discount > 0 ? [`Subtotal: ${formatPrice(total)}`, `Descuento: −${formatPrice(discount)}`] : []),
    totalLine,
    ...(rewards.length ? [`✓ *Premio:* ${rewards.join(' + ')}`] : []),
    ...(freeShipping ? ['✓ *Envío gratis*'] : []),
    ...(extra.length ? ['', '*Mis datos*', ...extra] : []),
    '',
    freeShipping
      ? '¿Me confirmas si está disponible? ¡Mil gracias! ☺'
      : '¿Me confirmas si está disponible y cuánto vale el envío? ¡Mil gracias! ☺',
  ].join('\n')
}

// Pregunta por un producto (con su enlace: el negocio ve la foto en el chat)
export function productQuestionMessage(product, businessName = '', { slug, size, color } = {}) {
  const opts = [size && `Talla ${size}`, color && `Color ${color}`].filter(Boolean).join(' · ')
  const price = Number(product?.price) > 0 ? formatPrice(product.price) : ''
  return [
    `✨ ¡Hola, *${businessName}*! ✨`,
    'Me encantó este producto ♡',
    '',
    `✦ *${nameOf(product, 1)}*`,
    ...(opts ? [`     ${opts}`] : []),
    ...(price ? [`     ${price}`] : []),
    ...(slug && product?.id ? [`     Ver foto: ${productUrl(slug, product.id)}`] : []),
    '',
    '¿Está disponible? ¡Gracias! ☺',
  ].join('\n')
}
