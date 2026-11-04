// Utilidades de productos del catálogo

// Secciones de la versión anterior → sección nueva donde aparecen sus productos
export const LEGACY_SECTIONS = {
  featured: 'destacados',
  promos_grande: 'destacados',
  carousel_cajas: 'personalizados',
  list_regalos: 'personalizados',
  promos_mediano: 'personalizados',
  promos_circulo: 'personalizados',
  grid_arreglos: 'flores',
}

// Secciones en las que aparece un producto
export const productSections = (p) => {
  if (Array.isArray(p?.sections) && p.sections.length) return p.sections
  if (!p?.section) return []
  return [LEGACY_SECTIONS[p.section] || p.section]
}

// ¿Es una foto real? (no vacía ni la imagen de muestra)
export const isRealPhoto = (u) => !!u && typeof u === 'string' && !u.includes('placehold.co')

// Producto aún sin terminar: SIN NINGUNA foto real.
// (Antes también se ocultaba si el nombre seguía siendo «Nuevo Producto»: la dueña veía
// sus fotos en modo edición, pero sus clientes no veían nada.)
export const isDraft = (p) => !isRealPhoto(p?.image) && !(p?.images || []).some(isRealPhoto)

/* ── Opciones de producto (opcionales): tallas, colores y precio anterior ── */

// "S, M, L" → ['S', 'M', 'L']
export const productSizes = (p) =>
  String(p?.sizes || '').split(',').map(s => s.trim()).filter(Boolean)

const COLOR_NAMES = {
  negro: '#111111', blanco: '#FFFFFF', gris: '#9A9A9A', 'gris claro': '#C9C9C9', 'gris oscuro': '#4A4A4A',
  beige: '#E8DCC4', crema: '#F3EAD7', cafe: '#6F4E37', 'café': '#6F4E37', marron: '#6F4E37', 'marrón': '#6F4E37',
  rojo: '#C62828', vinotinto: '#6D1B2B', rosa: '#F4A6C0', rosado: '#F4A6C0', fucsia: '#D81B60',
  naranja: '#F57C00', amarillo: '#F9D648', dorado: '#C9A227', plateado: '#C0C0C0',
  verde: '#2E7D32', 'verde oliva': '#6B7A3A', menta: '#9ED9C4', azul: '#1E5AA8', 'azul oscuro': '#1B2A49', celeste: '#8EC9EE',
  morado: '#6A1B9A', lila: '#C8A2C8', lavanda: '#C7B6F2', turquesa: '#26A69A',
}

// "Negro, Gris #999999" → [{ name: 'Negro', hex: '#111111' }, { name: 'Gris', hex: '#999999' }]
export const productColors = (p) =>
  String(p?.colors || '').split(',').map(s => s.trim()).filter(Boolean).map(entry => {
    const hex = entry.match(/#[0-9a-f]{3,8}\b/i)?.[0]
    const name = entry.replace(/#[0-9a-f]{3,8}\b/i, '').trim() || hex
    const key = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    return { name, hex: hex || COLOR_NAMES[name.toLowerCase()] || COLOR_NAMES[key] || '#CCCCCC' }
  })

// Precio anterior y % de descuento (si el precio anterior es mayor y la oferta sigue vigente)
export const productDiscount = (p) => {
  const now = Number(p?.price) || 0
  const before = Number(p?.oldPrice) || 0
  if (!now || before <= now) return null
  if (p?.offerEnds && new Date(p.offerEnds).getTime() <= Date.now()) return null
  return { before, percent: Math.round((1 - now / before) * 100) }
}
