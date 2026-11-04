// Estructura "Editorial" (estilo revista / portafolio): nombre gigante, círculo con foto,
// sello giratorio, cinta animada y productos numerados.
import { useRef } from 'react'
import { navigate, loginPath } from '@/app/router'
import { useAdmin } from '@/features/editor/EditorProvider'
import EditText from '@/features/editor/EditText'
import Icon from '@/shared/ui/Icon'
import { MarketingSections } from '@/features/marketing/Boost'
import { useFitText, useReveal } from '@/features/portfolio/effects'
import SectionBlock from './SectionBlock'
import { useSkin, useSearch, Price } from './shared'
import './Editorial.css'
import { optimizeImg } from '@/lib/images'

const ICONS = ['truck', 'card', 'chat', 'gift']

export default function EditorialView({ onOpenDashboard }) {
  const s = useSkin()
  const { canEdit } = useAdmin()
  const search = useSearch(s.products)
  const root = useRef(null)
  const H = s.content.hero
  const F = s.content.footer
  const word = (s.brand.name || '').toUpperCase()
  const [box, inner] = useFitText(word)
  useReveal(root, [s.sections.length, s.products.length, search.results?.length])
  const go = (id) => document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth' })
  const first = s.sections[0]

  return (
    <div className="ed" ref={root}>
      <header className="ed-top">
        <span className="ed-top__k"><span className="ed-star" aria-hidden="true">✱</span>{s.brand.tagline || s.brand.city || 'Catálogo'}</span>
        <nav className="ed-top__nav" aria-label="Secciones">
          {s.sections.slice(0, 4).map(x => <button key={x.id} onClick={() => go(x.id)}>{x.name}</button>)}
        </nav>
        <div className="ed-top__actions">
          <label className="ed-search">
            <Icon name="search" size={16} />
            <input type="search" placeholder="Buscar" value={search.term} onChange={e => search.setTerm(e.target.value)} aria-label="Buscar productos" />
          </label>
          {canEdit
            ? <button className="ed-ic" onClick={onOpenDashboard} aria-label="Panel de administración"><Icon name="settings" size={19} /></button>
            : <button className="ed-ic" onClick={() => navigate(loginPath())} aria-label="Acceso administrador"><Icon name="user" size={19} /></button>}
          <button className="ed-ic ed-cart" onClick={s.openCart} aria-label={`Pedido, ${s.count} productos`}><Icon name="cart" size={19} />{s.count > 0 && <b>{s.count}</b>}</button>
        </div>
      </header>

      <main id="top">
        {search.results ? (
          <section className="ed-sec">
            <div className="ed-sec__head">
              <h2 className="ed-h2">Resultados<br /><em>“{search.term}”</em></h2>
              <button className="ed-link" onClick={() => search.setTerm('')}>Limpiar búsqueda <Icon name="close" size={16} /></button>
            </div>
            <Cards items={search.results} openProduct={s.openProduct} />
          </section>
        ) : (
          <>
            <section className="ed-hero">
              <div className="ed-big" ref={box} aria-hidden="true">
                <span ref={inner} className="ed-big__inner">
                  {[...word].map((ch, i) => <span key={i} className="ed-big__ch" style={{ '--i': i }}>{ch === ' ' ? ' ' : ch}</span>)}
                </span>
              </div>
              <div className="ed-hero__grid">
                <div className="ed-hero__text">
                  <EditText path="hero.sticker" fallback={H.sticker} as="p" className="ed-kicker ed-in" />
                  <h1 className="ed-h1 ed-in" style={{ '--d': '.15s' }}>
                    <EditText path="hero.titleStart" fallback={H.titleStart} /> <em><EditText path="hero.titleEmphasis" fallback={H.titleEmphasis} /></em> <EditText path="hero.titleEnd" fallback={H.titleEnd} />
                  </h1>
                  <EditText path="hero.subtitle" fallback={H.subtitle} as="p" className="ed-intro ed-in" multiline />
                  <p className="ed-sign ed-in" style={{ '--d': '.35s' }} aria-hidden="true">{s.brand.name}</p>
                  <div className="ed-ctas ed-in" style={{ '--d': '.45s' }}>
                    <button className="ed-btn ed-btn--ink" onClick={() => first && go(first.id)}><EditText path="hero.primaryCta" fallback={H.primaryCta} inButton /> <Icon name="arrow" size={16} /></button>
                    <button className="ed-btn" onClick={() => s.wa.open()}><Icon name="whatsapp" size={18} /> <EditText path="hero.secondaryCta" fallback={H.secondaryCta} inButton /></button>
                  </div>
                </div>
                <div className="ed-hero__art">
                  <div className="ed-circle" />
                  {s.heroImage && (
                    <button className="ed-photo" onClick={() => s.featured && s.openProduct(s.featured)} aria-label={s.featured ? `Ver ${s.featured.name}` : 'Producto destacado'}>
                      <img src={optimizeImg(s.heroImage, 1400)} alt="" fetchPriority="high" decoding="async" />
                    </button>
                  )}
                  <Seal text={`${H.sticker || s.brand.name} · `} />
                </div>
              </div>
            </section>

            {s.content.ribbon.length > 0 && (
              <div className="ed-marquee" aria-label={s.content.ribbon.join(', ')}>
                <div className="ed-marquee__track" aria-hidden="true">
                  {[0, 1].map(k => <span key={k}>{[...s.content.ribbon, ...s.content.ribbon].map((t, i) => <span key={i}>{t}<i>✱</i></span>)}</span>)}
                </div>
              </div>
            )}

            {s.loading && <p className="ed-sec">Cargando productos…</p>}
            {s.sections.map(sec => (
              <section key={sec.id} className="ed-sec" id={`sec-${sec.id}`}>
                <div className="ed-sec__head">
                  <h2 className="ed-h2" data-reveal>{sec.title || sec.name}{sec.emphasis && <><br /><em>{sec.emphasis}</em></>}</h2>
                  {sec.subtitle && <p className="ed-sec__intro" data-reveal>{sec.subtitle}</p>}
                  <button className="ed-link" onClick={() => s.wa.open()} data-reveal>¿Algo especial? <Icon name="arrow" size={16} /></button>
                </div>
                <SectionBlock sec={sec}><Cards items={sec.items} openProduct={s.openProduct} /></SectionBlock>
              </section>
            ))}

            <section className="ed-sec ed-way">
              <div>
                <h2 className="ed-h2" data-reveal>Cómo<br /><em>pedir</em></h2>
                <ol className="ed-steps">
                  {s.content.how.map((h, i) => (
                    <li key={i} data-reveal style={{ '--d': `${i * 0.08}s` }}><span>{String(i + 1).padStart(2, '0')}</span><strong>{h.title}</strong><small>{h.text}</small></li>
                  ))}
                </ol>
              </div>
              <blockquote className="ed-quote" data-reveal><span aria-hidden="true">“</span>{s.content.story.text}</blockquote>
              <ul className="ed-feats">
                {s.content.highlights.slice(0, 4).map((h, i) => (
                  <li key={h.id} data-reveal style={{ '--d': `${i * 0.08}s` }}>
                    <span className="ed-feats__ic"><Icon name={ICONS[i]} size={20} /></span>
                    <span><strong>{h.title}</strong><small>{h.text || (h.steps || [])[0]}</small></span>
                  </li>
                ))}
              </ul>
            </section>

            {s.content.faq.length > 0 && (
              <section className="ed-sec" id="preguntas">
                <div className="ed-sec__head"><h2 className="ed-h2" data-reveal>Preguntas<br /><em>frecuentes</em></h2></div>
                <div className="ed-faq">
                  {s.content.faq.map((f, i) => (
                    <details key={i} data-reveal style={{ '--d': `${i * 0.05}s` }}><summary><span>{String(i + 1).padStart(2, '0')}</span>{f.q}<Icon name="plus" size={18} /></summary><p>{f.a}</p></details>
                  ))}
                </div>
              </section>
            )}

            <section className="ed-sec ed-cta">
              <div>
                <h2 className="ed-h2 ed-h2--xl" data-reveal>{F.title}<br /><em>{F.emphasis} {F.titleEnd}</em></h2>
                <div className="ed-ctas" data-reveal>
                  <button className="ed-btn ed-btn--accent" onClick={() => s.wa.open()}><Icon name="whatsapp" size={18} /> {F.cta}</button>
                </div>
              </div>
              <div className="ed-cta__side" data-reveal>
                <span className="ed-cta__spin" aria-hidden="true">✱</span>
                <ul>
                  {s.brand.city && <li><Icon name="truck" size={18} /> {F.eyebrow || s.brand.city}</li>}
                  {s.brand.instagram && <li><Icon name="instagram" size={18} /> <a href={s.brand.instagram} target="_blank" rel="noopener noreferrer">Instagram</a></li>}
                  {s.brand.tiktok && <li><Icon name="tiktok" size={18} /> <a href={s.brand.tiktok} target="_blank" rel="noopener noreferrer">TikTok</a></li>}
                  {s.brand.facebook && <li><Icon name="facebook" size={18} /> <a href={s.brand.facebook} target="_blank" rel="noopener noreferrer">Facebook</a></li>}
                </ul>
                <p className="ed-sign ed-sign--sm" aria-hidden="true">{s.brand.name}</p>
              </div>
            </section>
          </>
        )}
      </main>

      <MarketingSections />

      <footer className="ed-foot">
        <span className="ed-foot__brand">{s.brand.name}</span>
        <span>© {new Date().getFullYear()} · {F.legal}</span>
        <a href="/admin">Administrar</a>
      </footer>
    </div>
  )
}

function Seal({ text }) {
  const t = (text || '').toUpperCase()
  return (
    <div className="ed-seal" aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <defs><path id="ed-seal-path" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" /></defs>
        <text><textPath href="#ed-seal-path" textLength="288">{t.repeat(Math.max(1, Math.round(40 / Math.max(1, t.length))))}</textPath></text>
      </svg>
      <span>✱</span>
    </div>
  )
}

function Cards({ items, openProduct }) {
  return (
    <div className="ed-cards">
      {items.map((p, i) => (
        <button key={p.id} className="ed-card" data-reveal style={{ '--d': `${(i % 4) * 0.07}s` }} onClick={() => openProduct(p)}>
          <span className="ed-card__img">
            <img src={optimizeImg(p.image, 600)} alt="" loading="lazy" decoding="async" />
            <span className="ed-card__go" aria-hidden="true"><Icon name="arrow" size={18} /></span>
            {p.badge && <span className="ed-card__badge">{p.badge}</span>}
          </span>
          <span className="ed-card__meta">
            <span className="ed-card__num">{String(i + 1).padStart(2, '0')}</span>
            <span><strong>{p.name}</strong><Price p={p} /></span>
          </span>
        </button>
      ))}
    </div>
  )
}
