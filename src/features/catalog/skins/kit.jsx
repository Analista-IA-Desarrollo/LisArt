// ─────────────────────────────────────────────────────────────
// Kit común de las estructuras nuevas (Menú, Servicios, Bento,
// Lookbook, Tienda grande y Lujo): animaciones al hacer scroll,
// botones de cabecera, agregar rápido, pie de página y preguntas.
// ─────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'
import { navigate, loginPath } from '@/app/router'
import { useAdmin } from '@/features/editor/EditorProvider'
import { useCart } from '@/features/cart/CartProvider'
import { useAddToCart } from '@/features/cart/useAddToCart'
import { useSettingsCtx } from '@/features/catalog/data/SettingsProvider'
import { productSizes, productColors } from '@/lib/catalog'
import { stockInfo } from '@/lib/marketing'
import Icon from '@/shared/ui/Icon'
import './Kit.css'
import { optimizeImg, srcSetFor } from '@/lib/images'

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Aparición suave de los elementos [data-reveal], también de los que se agregan después
export function useRevealAll(root) {
  useEffect(() => {
    const el = root.current
    if (!el) return
    if (reduced() || !('IntersectionObserver' in window)) {
      const all = () => el.querySelectorAll('[data-reveal]').forEach(i => i.classList.add('is-in'))
      all()
      const mo = new MutationObserver(all)
      mo.observe(el, { childList: true, subtree: true })
      return () => mo.disconnect()
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) } })
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
    const seen = new WeakSet()
    const scan = () => el.querySelectorAll('[data-reveal]:not(.is-in)').forEach(i => { if (!seen.has(i)) { seen.add(i); io.observe(i) } })
    scan()
    const mo = new MutationObserver(scan)
    mo.observe(el, { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect() }
  }, [root])
}

// ¿Ya se bajó en la página? (para cabeceras que cambian al hacer scroll)
export function useScrolled(offset = 24) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    let raf = 0
    const check = () => { raf = 0; setOn(window.scrollY > offset) }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check) }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [offset])
  return on
}

// Sección visible en pantalla (para resaltar la pestaña activa)
export function useScrollSpy(ids, prefix = 'sec-') {
  const [active, setActive] = useState(ids[0] || '')
  const key = ids.join('|')
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const els = ids.map(id => document.getElementById(prefix + id)).filter(Boolean)
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (vis[0]) setActive(vis[0].target.id.slice(prefix.length))
    }, { rootMargin: '-35% 0px -55% 0px' })
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [key, prefix]) // eslint-disable-line react-hooks/exhaustive-deps
  return [active, setActive]
}

export const scrollToSection = (id, prefix = 'sec-') => document.getElementById(prefix + id)?.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' })

// Brillo que sigue al cursor (variables --mx / --my en el elemento)
export function usePointerGlow() {
  return {
    onPointerMove: (e) => {
      const r = e.currentTarget.getBoundingClientRect()
      e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
      e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
    },
  }
}

/* ── Botones de cabecera ── */
export function CartButton({ s, className = '' }) {
  const prev = useRef(s.count)
  const [bump, setBump] = useState(false)
  useEffect(() => {
    if (s.count > prev.current) { setBump(true); const t = setTimeout(() => setBump(false), 500); prev.current = s.count; return () => clearTimeout(t) }
    prev.current = s.count
  }, [s.count])
  return (
    <button className={`kt-ic kt-cart ${bump ? 'is-bump' : ''} ${className}`} onClick={s.openCart} aria-label={`Carrito, ${s.count} ${s.count === 1 ? 'producto' : 'productos'}`}>
      <Icon name="cart" size={21} />
      {s.count > 0 && <b className="kt-count">{s.count}</b>}
    </button>
  )
}

export function AdminButton({ onOpenDashboard, className = '' }) {
  const { canEdit } = useAdmin()
  return canEdit
    ? <button className={`kt-ic ${className}`} onClick={onOpenDashboard} aria-label="Panel de administración"><Icon name="settings" size={20} /></button>
    : <button className={`kt-ic ${className}`} onClick={() => navigate(loginPath())} aria-label="Acceso administrador"><Icon name="user" size={20} /></button>
}

/* ── Agregar rápido (si tiene tallas o colores abre la ficha) ── */
export function useQty(id) {
  const { items } = useCart()
  return items.filter(i => i.id === id).reduce((a, i) => a + i.qty, 0)
}

export function QuickAdd({ p, openProduct, className = '', label, icon = 'plus', size = 18 }) {
  const { add, added } = useAddToCart()
  const { marketing } = useSettingsCtx()
  const qty = useQty(p.id)
  const out = stockInfo(p, marketing)?.out
  const needsOptions = productSizes(p).length > 0 || productColors(p).length > 1
  const done = added[p.id]
  return (
    <button type="button" className={`kt-add ${done ? 'is-ok' : ''} ${qty ? 'has-qty' : ''} ${className}`} disabled={out}
      aria-label={out ? `${p.name} agotado` : needsOptions ? `Elegir opciones de ${p.name}` : `Agregar ${p.name} al carrito`}
      onClick={(e) => { e.stopPropagation(); needsOptions ? openProduct(p) : add(p) }}>
      <Icon name={done ? 'check' : icon} size={size} />
      {label && <span>{out ? 'Agotado' : done ? 'Agregado' : label}</span>}
      {qty > 0 && !label && <b className="kt-add__n">{qty}</b>}
    </button>
  )
}

/* ── Imagen con carga suave ── */
export function Img({ src, alt = '', className = '', eager = false, w = 800, sizes, ...rest }) {
  const [ok, setOk] = useState(false)
  if (!src) return <span className={`kt-img kt-img--empty ${className}`} aria-hidden="true" />
  // Rendimiento: tamaño justo (srcset), carga diferida y prioridad alta solo para la foto principal
  const set = srcSetFor(src)
  return (
    <img src={optimizeImg(src, w)} srcSet={set} sizes={set ? (sizes || (eager ? '(max-width: 700px) 100vw, 60vw' : '(max-width: 560px) 50vw, (max-width: 1100px) 33vw, 360px')) : undefined}
      alt={alt} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} decoding="async"
      className={`kt-img ${ok ? 'is-ok' : ''} ${className}`} onLoad={() => setOk(true)} onError={() => setOk(true)} {...rest} />
  )
}

/* ── Preguntas frecuentes (acordeón animado) ── */
export function Faq({ items, className = '' }) {
  if (!items?.length) return null
  return (
    <div className={`kt-faq ${className}`}>
      {items.map((f, i) => (
        <details key={i} data-reveal style={{ '--d': `${i * 0.05}s` }}>
          <summary><span>{f.q}</span><i aria-hidden="true" /></summary>
          <div className="kt-faq__a"><p>{f.a}</p></div>
        </details>
      ))}
    </div>
  )
}

/* ── Esqueleto mientras cargan los productos ── */
export function Skeleton({ n = 6, className = '' }) {
  return <div className={`kt-skel ${className}`} aria-busy="true" aria-label="Cargando productos">{Array.from({ length: n }, (_, i) => <span key={i} />)}</div>
}

/* ── Pie de página común (cada estructura lo pinta con su clase) ── */
export function Footer({ s, className = '', go }) {
  const F = s.content.footer || {}
  const social = [['instagram', s.brand.instagram], ['tiktok', s.brand.tiktok], ['facebook', s.brand.facebook]].filter(x => x[1])
  return (
    <footer className={`kt-foot ${className}`}>
      <div className="kt-foot__cta" data-reveal>
        <p className="kt-foot__eyebrow">{F.eyebrow}</p>
        <h2 className="kt-foot__title">{F.title} <em>{F.emphasis}</em> {F.titleEnd}</h2>
        <button className="kt-btn kt-btn--wa" onClick={() => s.wa.open()}><Icon name="whatsapp" size={20} /> {F.cta || 'Escríbenos por WhatsApp'}</button>
      </div>
      <div className="kt-foot__grid">
        <div>
          <p className="kt-foot__brand">{s.brand.logo ? <img src={s.brand.logo} alt="" /> : null}{s.brand.name}</p>
          {s.brand.tagline && <p className="kt-foot__muted">{s.brand.tagline}</p>}
          {s.brand.city && <p className="kt-foot__muted"><Icon name="pin" size={15} /> {s.brand.city}</p>}
        </div>
        {go && s.sections.length > 0 && (
          <nav className="kt-foot__links" aria-label="Secciones">
            <strong>Catálogo</strong>
            {s.sections.slice(0, 6).map(x => <button key={x.id} onClick={() => go(x.id)}>{x.name}</button>)}
          </nav>
        )}
        <div className="kt-foot__links">
          <strong>Contacto</strong>
          <button onClick={() => s.wa.open()}>WhatsApp</button>
          {social.map(([k, url]) => <a key={k} href={url} target="_blank" rel="noopener noreferrer"><Icon name={k} size={15} /> {k[0].toUpperCase() + k.slice(1)}</a>)}
        </div>
      </div>
      <p className="kt-foot__legal">© {new Date().getFullYear()} {s.brand.name}{F.legal ? ` · ${F.legal}` : ''} · <a href="/admin">Administrar</a></p>
    </footer>
  )
}

// Número animado (cuenta hacia arriba cuando aparece en pantalla)
export function CountUp({ value }) {
  const ref = useRef(null)
  const str = String(value ?? '')
  const m = str.match(/^([^\d]*)(\d[\d.,]*)(.*)$/)
  const [shown, setShown] = useState(m ? `${m[1]}0${m[3]}` : str)
  useEffect(() => {
    if (!m || reduced()) { setShown(str); return }
    const target = Number(m[2].replace(/[.,]/g, ''))
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) { setShown(str); return }
    let raf = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / 1100)
        const v = Math.round(target * (1 - Math.pow(1 - k, 3)))
        setShown(`${m[1]}${v.toLocaleString('es-CO')}${m[3]}`)
        if (k < 1) raf = requestAnimationFrame(tick)
        else setShown(str)
      }
      raf = requestAnimationFrame(tick)
    })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [str]) // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref}>{shown}</span>
}
