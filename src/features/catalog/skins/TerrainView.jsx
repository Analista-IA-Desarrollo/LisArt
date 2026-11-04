// Estructura "Streetwear" (inspirada en tiendas tipo Terrain):
// retícula con líneas, titulares en mayúscula, franja de cifras y colección en carrusel.
import { useEffect, useRef, useState } from 'react'
import { navigate, loginPath } from '@/app/router'
import { useAdmin } from '@/features/editor/EditorProvider'
import EditText from '@/features/editor/EditText'
import Icon from '@/shared/ui/Icon'
import { MarketingSections } from '@/features/marketing/Boost'
import { useAddToCart } from '@/features/cart/useAddToCart'
import { productSizes, productColors } from '@/lib/catalog'
import SectionBlock from './SectionBlock'
import { useSkin, useSearch, Price, ProductOptions } from './shared'
import './Terrain.css'
import { optimizeImg } from '@/lib/images'

const pad = (n) => String(n).padStart(3, '0')
const ICONS = ['truck', 'card', 'chat', 'gift']

export default function TerrainView({ onOpenDashboard }) {
  const s = useSkin()
  const { canEdit } = useAdmin()
  const search = useSearch(s.products)
  const [searching, setSearching] = useState(false)
  const [msg, setMsg] = useState('')
  const H = s.content.hero
  const year = new Date().getFullYear()
  const go = (id) => document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth' })
  const collection = s.sections[0]

  return (
    <div className="tr">
      <header className="tr-head">
        <a href="#top" className="tr-cell tr-brand">{s.brand.logo ? <img src={s.brand.logo} alt={s.brand.name} /> : <>{s.brand.name}<sup>®</sup></>}</a>
        <nav className="tr-cell tr-nav" aria-label="Secciones">
          {s.sections.slice(0, 5).map(x => <button key={x.id} onClick={() => go(x.id)}><span aria-hidden="true">+</span> {x.name}</button>)}
        </nav>
        <button className="tr-cell tr-search-btn" onClick={() => setSearching(v => !v)} aria-expanded={searching}>
          <span>{searching ? 'Cerrar' : 'Buscar'}</span> <Icon name={searching ? 'close' : 'search'} size={16} />
        </button>
        {canEdit
          ? <button className="tr-cell tr-icon" onClick={onOpenDashboard} aria-label="Panel de administración"><Icon name="settings" size={18} /></button>
          : <button className="tr-cell tr-icon" onClick={() => navigate(loginPath())} aria-label="Acceso administrador"><Icon name="user" size={18} /></button>}
        <button className="tr-cell tr-cart" onClick={s.openCart} aria-label={`Pedido, ${s.count} productos`}>
          Pedido <b>[ {String(s.count).padStart(2, '0')} ]</b>
        </button>
      </header>
      {searching && (
        <div className="tr-searchbar">
          <input autoFocus type="search" placeholder="BUSCAR PRODUCTOS" value={search.term} onChange={e => search.setTerm(e.target.value)} aria-label="Buscar productos" />
        </div>
      )}

      <main id="top">
        {search.results ? (
          <section className="tr-sec">
            <div className="tr-sec__head"><h2>Resultados <span>“{search.term}”</span></h2><button className="tr-link" onClick={() => search.setTerm('')}>Limpiar <Icon name="close" size={14} /></button></div>
            <Grid items={search.results} openProduct={s.openProduct} />
          </section>
        ) : (
          <>
            <section className="tr-hero">
              <div className="tr-hero__text">
                <p className="tr-eyebrow">Temporada {year}<br />Colección {String(s.sections.length).padStart(3, '0')}</p>
                <h1 className="tr-title">
                  <EditText path="hero.titleStart" fallback={H.titleStart} />{' '}
                  <em><EditText path="hero.titleEmphasis" fallback={H.titleEmphasis} /> <EditText path="hero.titleEnd" fallback={H.titleEnd} /></em>
                  <sup>™</sup>
                </h1>
                <EditText path="hero.subtitle" fallback={H.subtitle} as="p" className="tr-hero__sub" multiline />
                <button className="tr-btn" onClick={() => collection && go(collection.id)}>
                  <EditText path="hero.primaryCta" fallback={H.primaryCta} inButton /> <Icon name="arrow" size={16} />
                </button>
                <p className="tr-scroll">Desliza para descubrir <Icon name="arrowDown" size={14} /></p>
              </div>
              <div className="tr-hero__media">
                {s.heroImage && <img src={optimizeImg(s.heroImage, 1400)} alt="" fetchPriority="high" decoding="async" />}
                <span className="tr-cross tr-cross--a" aria-hidden="true" />
                <span className="tr-cross tr-cross--b" aria-hidden="true" />
                <span className="tr-vlabel" aria-hidden="true">{s.brand.name} · {year}</span>
              </div>
              {s.featured && (
                <div className="tr-hero__panel">
                  <p className="tr-num">{pad(1)}</p>
                  <h2 className="tr-pname">{s.featured.name}</h2>
                  <Price p={s.featured} className="tr-pprice" />
                  {s.featured.description && <p className="tr-pdesc">{s.featured.description}</p>}
                  <ProductOptions p={s.featured} compact />
                  <button className="tr-link" onClick={() => s.openProduct(s.featured)}>Ver detalle <Icon name="arrow" size={14} /></button>
                </div>
              )}
            </section>

            <section className="tr-band" aria-label="Nosotros">
              <div className="tr-band__mission">
                <p className="tr-band__k">Nuestra misión</p>
                <p className="tr-band__t">{s.content.story.text}</p>
                <button className="tr-btn tr-btn--light" onClick={() => s.wa.open()}>Escríbenos <Icon name="arrow" size={14} /></button>
              </div>
              <div className="tr-band__seal" aria-hidden="true">
                <svg viewBox="0 0 100 100"><defs><path id="tr-seal" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs>
                  <text><textPath href="#tr-seal" textLength="238">{`${s.brand.name} · HECHO CON CALIDAD · `.toUpperCase()}</textPath></text></svg>
                <Icon name="sparkle" size={22} />
              </div>
              {s.content.stats.slice(0, 3).map((st, i) => (
                <div key={i} className="tr-band__stat">
                  <p className="tr-band__k">{st.label}</p>
                  <p className="tr-band__v">{st.value}</p>
                </div>
              ))}
            </section>

            {collection && collection.items.length > 0 && <Coverflow sec={collection} openProduct={s.openProduct} />}

            {s.loading && <p className="tr-sec">Cargando productos…</p>}
            {s.sections.slice(1).map(sec => (
              <section key={sec.id} className="tr-sec" id={`sec-${sec.id}`}>
                <div className="tr-sec__head">
                  <h2>{[sec.title, sec.emphasis].filter(Boolean).join(' ') || sec.name} <span>+</span></h2>
                  {sec.subtitle && <p>{sec.subtitle}</p>}
                </div>
                <SectionBlock sec={sec}><Grid items={sec.items} openProduct={s.openProduct} /></SectionBlock>
              </section>
            ))}

            {s.content.highlights.length > 0 && (
              <section className="tr-feats" aria-label="Beneficios">
                {s.content.highlights.slice(0, 4).map((h, i) => (
                  <div key={h.id}>
                    <Icon name={ICONS[i]} size={26} />
                    <span><strong>{h.title}</strong><small>{h.text || (h.steps || [])[0]}</small></span>
                  </div>
                ))}
              </section>
            )}

            {s.content.faq.length > 0 && (
              <section className="tr-sec tr-faq" id="preguntas">
                <div className="tr-sec__head"><h2>Preguntas <span>+</span></h2></div>
                {s.content.faq.map((f, i) => (
                  <details key={i}><summary><span>{String(i + 1).padStart(2, '0')}</span>{f.q}<Icon name="plus" size={16} /></summary><p>{f.a}</p></details>
                ))}
              </section>
            )}
          </>
        )}
      </main>

      <MarketingSections />

      <footer className="tr-foot">
        <div className="tr-foot__brand">
          <p className="tr-brand tr-brand--foot">{s.brand.name}<sup>®</sup></p>
          <p>© {year} {s.brand.name}<br />{s.content.footer.legal}</p>
        </div>
        <div className="tr-foot__col">
          <strong>Tienda</strong>
          {s.sections.map(x => <button key={x.id} onClick={() => go(x.id)}>{x.name}</button>)}
        </div>
        <div className="tr-foot__col">
          <strong>Ayuda</strong>
          {s.content.faq.length > 0 && <a href="#preguntas">Preguntas</a>}
          <button onClick={() => s.wa.open()}>WhatsApp</button>
          {s.brand.instagram && <a href={s.brand.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
          <a href="/admin">Administrar</a>
        </div>
        <form className="tr-foot__news" onSubmit={(e) => { e.preventDefault(); s.wa.open(msg || 'Hola {negocio} 👋 Quiero recibir novedades.'); setMsg('') }}>
          <strong>Mantente al tanto</strong>
          <p>Novedades, lanzamientos y ofertas directo a tu WhatsApp.</p>
          <div>
            <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Escríbenos un mensaje" aria-label="Mensaje" />
            <button type="submit" aria-label="Enviar por WhatsApp"><Icon name="arrow" size={18} /></button>
          </div>
        </form>
      </footer>
    </div>
  )
}

// Colección en carrusel: la tarjeta central se destaca con sus detalles
function Coverflow({ sec, openProduct }) {
  const track = useRef(null)
  const [active, setActive] = useState(0)
  const { add, added } = useAddToCart()
  const items = sec.items

  useEffect(() => {
    const el = track.current
    if (!el) return
    const on = () => {
      const mid = el.scrollLeft + el.clientWidth / 2
      let best = 0, dist = Infinity
      ;[...el.children].forEach((c, i) => { const d = Math.abs(c.offsetLeft + c.clientWidth / 2 - mid); if (d < dist) { dist = d; best = i } })
      setActive(best)
    }
    on()
    el.addEventListener('scroll', on, { passive: true })
    return () => el.removeEventListener('scroll', on)
  }, [items.length])

  const goTo = (i) => {
    const el = track.current, c = el?.children[i]
    if (c) el.scrollTo({ left: c.offsetLeft - (el.clientWidth - c.clientWidth) / 2, behavior: 'smooth' })
  }

  return (
    <section className="tr-coll" id={`sec-${sec.id}`}>
      <div className="tr-coll__side">
        <h2>{[sec.title, sec.emphasis].filter(Boolean).join(' ') || sec.name} <span>+</span></h2>
        {sec.subtitle && <p>{sec.subtitle}</p>}
        <div className="tr-coll__arrows">
          <button onClick={() => goTo(Math.max(0, active - 1))} aria-label="Anterior"><Icon name="chevronLeft" size={18} /></button>
          <button onClick={() => goTo(Math.min(items.length - 1, active + 1))} aria-label="Siguiente"><Icon name="chevron" size={18} /></button>
        </div>
      </div>
      <div className="tr-coll__track" ref={track}>
        {items.map((p, i) => {
          const needs = productSizes(p).length > 0 || productColors(p).length > 1
          return (
            <article key={p.id} className={`tr-cf ${i === active ? 'is-active' : ''}`} onClick={() => (i === active ? null : goTo(i))}>
              <div className="tr-cf__top"><strong>{p.name}</strong><span>[{pad(i + 1)}]</span></div>
              <Price p={p} className="tr-cf__price" />
              <img src={optimizeImg(p.image, 600)} alt="" loading="lazy" decoding="async" />
              {i === active && (
                <div className="tr-cf__actions">
                  <button onClick={(e) => { e.stopPropagation(); openProduct(p) }}>Ver <Icon name="arrow" size={14} /></button>
                  <button className="is-accent" onClick={(e) => { e.stopPropagation(); needs ? openProduct(p) : add(p) }}>
                    {added[p.id] ? 'Agregado' : 'Agregar'} <Icon name={added[p.id] ? 'check' : 'arrow'} size={14} />
                  </button>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function Grid({ items, openProduct }) {
  return (
    <div className="tr-grid">
      {items.map((p, i) => (
        <button key={p.id} className="tr-card" onClick={() => openProduct(p)}>
          <span className="tr-card__top"><span>{p.badge || ''}</span><span>[{pad(i + 1)}]</span></span>
          <span className="tr-card__img"><img src={optimizeImg(p.image, 600)} alt="" loading="lazy" decoding="async" /></span>
          <strong>{p.name}</strong>
          <Price p={p} />
        </button>
      ))}
    </div>
  )
}
