// Productos del negocio actual, sincronizados EN TIEMPO REAL.
// Cualquier cambio (desde cualquier dispositivo) se ve al instante en todos.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTenant } from '@/features/tenant/TenantProvider'
import * as productsApi from '@/services/products.service'
import { uploadImage } from '@/lib/cloudinary'
import { productSections, isRealPhoto } from '@/lib/catalog'

const Ctx = createContext(null)

// Fecha de Firestore (Timestamp), texto ISO o pendiente → milisegundos
const toMillis = (ts) => {
  if (!ts) return Number.MAX_SAFE_INTEGER // recién creado (aún sin hora del servidor)
  if (typeof ts === 'string') return Date.parse(ts) || 0
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  return (ts.seconds || 0) * 1000
}

const NEW_PRODUCT = {
  name: 'Nuevo Producto',
  category: '',
  description: '',
  personalizacion: '',
  pricePrefix: '',
  price: 0,
  image: 'https://placehold.co/400x400?text=Imagen',
  images: [],
  badge: '',
  rating: '',
  featured: false,
}

export function ProductsProvider({ children }) {
  const { tenantId, imageFolder } = useTenant()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const ref = useRef(products)
  ref.current = products

  useEffect(() => {
    if (!tenantId) return
    setLoading(true)
    return productsApi.watchProducts(
      tenantId,
      (list) => {
        // Orden estable: por fecha de creación
        const sorted = [...list].sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt))
          // Portada sin foto real pero con fotos en la galería: se muestra la primera de ellas
          .map(p => (!isRealPhoto(p.image) && (p.images || []).some(isRealPhoto)) ? { ...p, image: p.images.find(isRealPhoto) } : p)
        setProducts(sorted); setLoading(false); setError(null)
      },
      (err) => { setError(err.message); setLoading(false) },
    )
  }, [tenantId])

  const find = (id) => ref.current.find(p => p.id === id)
  const patch = useCallback((id, data) => productsApi.updateProduct(tenantId, id, data), [tenantId])

  const api = useMemo(() => ({
    createProduct: async (sectionId) => {
      const data = { ...NEW_PRODUCT, section: sectionId, sections: [sectionId], featured: sectionId === 'featured' }
      const id = await productsApi.createProduct(tenantId, data)
      return { id, ...data }
    },
    updateField: (id, field, value) => patch(id, { [field]: value }),
    updateImage: async (id, file) => {
      const url = await uploadImage(file, imageFolder)
      // Si el nombre sigue siendo el de muestra, se quita para que no aparezca así a los clientes
      await patch(id, find(id)?.name === NEW_PRODUCT.name ? { image: url, name: '' } : { image: url })
      return url
    },
    addImages: async (id, files) => {
      const list = Array.from(files || []).filter(f => f.type?.startsWith('image/'))
      const urls = []
      for (const f of list) urls.push(await uploadImage(f, imageFolder))
      if (urls.length) {
        const p = find(id)
        // Sin portada real todavía: la primera foto subida pasa a ser la portada
        if (!isRealPhoto(p?.image)) await patch(id, { image: urls[0], images: [...(p?.images || []), ...urls.slice(1)] })
        else await patch(id, { images: [...(p?.images || []), ...urls] })
      }
      return urls
    },
    removeImage: (id, url) => patch(id, { images: (find(id)?.images || []).filter(u => u !== url) }),
    setCover: (id, url) => {
      const p = find(id)
      if (!p) return
      const rest = (p.images || []).filter(u => u !== url)
      return patch(id, { image: url, images: isRealPhoto(p.image) ? [p.image, ...rest] : rest })
    },
    setSections: (id, sections) => patch(id, { sections, section: sections[0] || '' }),
    deleteProduct: (id) => productsApi.deleteProduct(tenantId, id),
  }), [tenantId, imageFolder, patch])

  const getBySection = useCallback((s) => products.filter(p => productSections(p).includes(s)), [products])
  const getFeatured = useCallback(() => products.find(p => p.featured) || null, [products])

  const value = { products, loading, error, getBySection, getFeatured, ...api }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useProductsCtx() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useProductsCtx debe usarse dentro de <ProductsProvider>')
  return ctx
}
