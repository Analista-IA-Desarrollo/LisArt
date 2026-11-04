// Estructura "Tienda minimal" (inspirada en tiendas tipo Velora):
// barra de aviso, menú limpio, producto estrella con opciones y cuadrículas de productos.
import { useEffect, useState } from 'react'
import { navigate, loginPath } from '@/app/router'
import { useAdmin } from '@/features/editor/EditorProvider'
import EditText from '@/features/editor/EditText'
import Icon from '@/shared/ui/Icon'
import { MarketingSections } from '@/features/marketing/Boost'
import { productSizes, productColors } from '@/lib/catalog'
import { useAddToCart } from '@/features/cart/useAddToCart'
import SectionBlock from './SectionBlock'
import { useSkin, useSearch, Price, ProductOptions, ThumbGallery } from './shared'
import './Velora.css'
import { optimizeImg } from '@/lib/images'

const ICONS = ['truck', 'card', 'chat', 'gift']

export default function VeloraView({ onOpenDashboard }) {
  const s = useSkin()
  const { canEdit } = useAdmin()
  const search = useSearch(s.products)
  const [menu, setMenu] = useState(false)
  const [searching, setSearching] = useState(false)
  const [ann, setAnn] = useState(0)
  const H = s.content.hero

  useEffect(() => {
    if (s.announcements.length < 2) return
    const t = setInterval(() => setAnn(i => (i + 1) % s.announcements.length), 4500)
    return () => clearInterval(t)
  }, [s.announcements.length])

  const go = (id) => { setMenu(false); document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth' }) }

  return (
    <div className="vl">
      {s.announcements.length > 0 && (
        <div className="vl-ann" role="region" aria-label="Avisos">
          <p key={ann}><Icon name="truck" size={16} /> {s.announcements[ann % s.announcements.length].text}</p>
        </div>
      )}

      <header className="vl-head">
        <div className="vl-wrap vl-head__in">
          <button className="vl-icon vl-burger" onClick={() => setMenu(true)} aria-label="Abrir menú"><span /><span /><span /></button>
          <a href="#top" className="vl-logo">{s.brand.logo ? <img src={s.brand.logo} alt={s.brand.name} /> : s.brand.name}</a>
          <nav className="vl-nav" aria-label="Secciones">
            {s.sections.slice(0, 5).map(x => <button key={x.id} onClick={() => go(x.id)}>{x.name}</button>)}
          </nav>
          <div className="vl-actions">
            <button className="vl-icon" onClick={() => setSearching(v => !v)} aria-label="Buscar" aria-expanded={searching}><Icon name={searching ? 'close' : 'search'} size={21} /></button>
            {canEdit
              ? <button className="vl-icon" onClick={onOpenDashboard} aria-label="Panel de administración"><Icon name="settings" size={21} /></button>
              : <button className="vl-icon" onClick={() => navigate(loginPath())} aria-label="Acceso administrador"><Icon name="user" size={21} /></button>}
            <button className="vl-icon vl-cart" onClick={s.openCart} aria-label={`Pedido, ${s.count} productos`}>
              <Icon name="cart" size={21} />{s.count > 0 && <b>{s.count}</b>}
            </button>
          </div>
        </div>
        {searching && (
          <div className="vl-wrap vl-search">
            <Icon name="search" size={18} />
            <input autoFocus type="search" placeholder="¿Qué estás buscando?" value={search.term} onChange={e => search.setTerm(e.target.value)} aria-label="Buscar productos" />
          </div>
        )}
      </header>

      {menu && (
        <div className="vl-menu" role="dialog" aria-modal="true" aria-label="Menú" onClick={() => setMenu(false)}>
          <div className="vl-menu__panel" onClick={e => e.stopPropagation()}>
            <button className="vl-icon" onClick={() => setMenu(false)} aria-label="Cerrar menú"><Icon name="close" /></button>
            {s.sections.map(x => <button key={x.id} className="vl-menu__link" onClick={() => go(x.id)}>{x.name}<Icon name="chevron" size={18} /></button>)}
            <button className="vl-menu__link" onClick={() => { setMenu(false); s.wa.open() }}>Escríbenos por WhatsApp<Icon name="whatsapp" size={18} /></button>
          </div>
        </div>
      )}

      <main id="top">
        {search.results ? (
          <section className="vl-wrap vl-sec">
            <div className="vl-sec__head"><h2>Resultados para “{search.term}”</h2><button className="vl-more" onClick={() => search.setTerm('')}>Limpiar</button></div>
            {search.results.length ? <Grid items={search.results} openProduct={s.openProduct} /> : <p className="vl-empty">No encontramos productos con esa búsqueda.</p>}
          </section>
        ) : (
          <>
            <section className="vl-wrap vl-hero">
              <EditText path="hero.sticker" fallback={H.sticker} as="p" className="vl-chip" />
              <h1 className="vl-hero__title">
                <EditText path="hero.titleStart" fallback={H.titleStart} /> <EditText path="hero.titleEmphasis" fallback={H.titleEmphasis} /> <EditText path="hero.titleEnd" fallback={H.titleEnd} />
              </h1>
              <EditText path="hero.subtitle" fallback={H.subtitle} as="p" className="vl-hero__sub" multiline />
            </section>

            {s.featured && <Spotlight p={s.featured} perks={s.content.perks} />}

            {s.loading && <p className="vl-wrap vl-empty">Cargando productos…</p>}
            {s.sections.map(sec => <Section key={sec.id} sec={sec} openProduct={s.openProduct} />)}

            {s.content.highlights.length > 0 && (
              <section className="vl-wrap vl-benefits" aria-label="Beneficios">
                {s.content.highlights.slice(0, 4).map((h, i) => (
                  <div key={h.id}>
                    <Icon name={ICONS[i]} size={24} />
                    <strong>{h.title}</strong>
                    <small>{h.text || (h.steps || []).join(' ')}</small>
                  </div>
                ))}
              </section>
            )}

            {s.content.faq.length > 0 && (
              <section className="vl-wrap vl-sec vl-faq" id="preguntas">
                <div className="vl-sec__head"><h2>Preguntas frecuentes</h2></div>
                {s.content.faq.map((f, i) => (
                  <details key={i}><summary>{f.q}<Icon name="plus" size={18} /></summary><p>{f.a}</p></details>
                ))}
              </section>
            )}
          </>
        )}
      </main>

      <MarketingSections />

      <footer className="vl-foot">
        <div className="vl-wrap vl-foot__in">
          <div>
            <p className="vl-logo vl-logo--foot">{s.brand.name}</p>
            <p className="vl-foot__tag">{s.content.footer.tagline || s.content.footer.legal}</p>
          </div>
          <div className="vl-foot__links">
            <strong>Tienda</strong>
            {s.sections.slice(0, 6).map(x => <button key={x.id} onClick={() => go(x.id)}>{x.name}</button>)}
          </div>
          <div className="vl-foot__links">
            <strong>Ayuda</strong>
            <button onClick={() => s.wa.open()}>WhatsApp</button>
            {s.content.faq.length > 0 && <a href="#preguntas">Preguntas frecuentes</a>}
            {s.brand.instagram && <a href={s.brand.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
            {s.brand.tiktok && <a href={s.brand.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a>}
          </div>
        </div>
        <p className="vl-wrap vl-foot__legal">© {new Date().getFullYear()} {s.brand.name} · <a href="/admin">Administrar</a></p>
      </footer>
    </div>
  )
}

// Producto estrella con galería y opciones (como la ficha de una tienda)
function Spotlight({ p, perks }) {
  return (
    <section className="vl-wrap vl-spot" aria-label="Producto destacado">
      <ThumbGallery p={p} />
      <div className="vl-spot__info">
        <span className="vl-chip">{p.badge || 'Destacado'}</span>
        <h2 className="vl-spot__name">{p.name}</h2>
        <Price p={p} className="vl-spot__price" />
        {p.description && <p className="vl-spot__desc">{p.description}</p>}
        <hr />
        <ProductOptions p={p} />
        {perks?.length > 0 && (
          <ul className="vl-spot__perks">
            {perks.slice(0, 3).map((t, i) => <li key={i}><Icon name={['truck', 'card', 'chat'][i]} size={18} /> {t}</li>)}
          </ul>
        )}
      </div>
    </section>
  )
}

function Section({ sec, openProduct }) {
  const [all, setAll] = useState(false)
  const items = all ? sec.items : sec.items.slice(0, 8)
  return (
    <section className="vl-wrap vl-sec" id={`sec-${sec.id}`}>
      <div className="vl-sec__head">
        <h2>{[sec.title, sec.emphasis].filter(Boolean).join(' ') || sec.name}</h2>
        {sec.items.length > 8 && <button className="vl-more" onClick={() => setAll(v => !v)}>{all ? 'Ver menos' : 'Ver todo'} <Icon name="arrow" size={16} /></button>}
      </div>
      {sec.subtitle && <p className="vl-sec__sub">{sec.subtitle}</p>}
      <SectionBlock sec={sec}><Grid items={items} openProduct={openProduct} /></SectionBlock>
    </section>
  )
}

function Grid({ items, openProduct }) {
  const { add, added } = useAddToCart()
  return (
    <div className="vl-grid">
      {items.map(p => {
        const needsOptions = productSizes(p).length > 0 || productColors(p).length > 1
        const second = (p.images || []).find(u => u && u !== p.image)
        return (
          <article key={p.id} className="vl-card">
            <div className="vl-card__media">
            <button className="vl-card__img" onClick={() => openProduct(p)} aria-label={`Ver ${p.name}`}>
              <img src={optimizeImg(p.image, 600)} alt="" loading="lazy" decoding="async" />
              {second && <img className="vl-card__alt" src={second} alt="" loading="lazy" />}
              {p.badge && <span className="vl-card__badge">{p.badge}</span>}
            </button>
            <button className="vl-card__add" aria-label={needsOptions ? `Elegir opciones de ${p.name}` : `Agregar ${p.name}`}
              onClick={() => (needsOptions ? openProduct(p) : add(p))}>
              <Icon name={added[p.id] ? 'check' : needsOptions ? 'plus' : 'cart'} size={18} />
            </button>
            </div>
            <button className="vl-card__meta" onClick={() => openProduct(p)}>
              <strong>{p.name}</strong>
              <Price p={p} />
            </button>
          </article>
        )
      })}
    </div>
  )
}
