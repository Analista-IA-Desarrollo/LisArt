import { useEffect, useRef, useState } from 'react'
import { useAdmin } from '@/features/editor/EditorProvider'
import { useUI } from '@/features/catalog/UIProvider'
import { useSiteContent } from '@/features/tenant/useSiteContent'
import { useTenant } from '@/features/tenant/TenantProvider'
import { navigate, loginPath } from '@/app/router'
import Icon from '@/shared/ui/Icon'
import { useSettingsCtx } from '@/features/catalog/data/SettingsProvider'
import { goalAnnouncement } from '@/lib/marketing'
import './Header.css'

function AnnounceBar({ announcement }) {
  const { announcements: ANNOUNCEMENTS } = useSiteContent()
  const { marketing } = useSettingsCtx()
  const goalText = goalAnnouncement(marketing)
  const items = [
    ...(announcement ? [{ icon: 'sparkle', text: announcement, hot: true }] : []),
    ...(goalText ? [{ icon: 'truck', text: goalText, hot: true }] : []),
    ...ANNOUNCEMENTS,
  ]
  // Se duplica la lista para que la marquesina sea continua
  const loop = [...items, ...items]
  return (
    <div className="announce" role="region" aria-label="Anuncios">
      <p className="sr-only">{items.map(i => i.text).join('. ')}</p>
      <div className="announce__track" aria-hidden="true">
        {loop.map((it, i) => (
          <span key={i} className={`announce__item ${it.hot ? 'is-hot' : ''}`}>
            <span className="announce__icon"><Icon name={it.icon} size={16} strokeWidth={2} /></span>
            {it.text}
          </span>
        ))}
      </div>
    </div>
  )
}

function Header({ searchTerm = '', onSearchChange, cartCount = 0, onOpenDashboard, announcement }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [bump, setBump] = useState(false)
  const inputRef = useRef(null)
  const prevCount = useRef(cartCount)
  const { canEdit } = useAdmin()
  const { openCart } = useUI()
  const { brand } = useTenant()
  const logo = brand.logo
  // "Creaciones LisArt" → "Creaciones" pequeño + "LisArt" grande
  const words = brand.name.trim().split(/\s+/)
  const main = words.length > 1 ? words.pop() : words[0] || ''
  const prefix = words.length && words[0] !== main ? words.join(' ') : ''
  const initials = brand.name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w.slice(0, 3).toUpperCase())

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { if (searchOpen) inputRef.current?.focus() }, [searchOpen])

  // Pequeño rebote del contador cuando se agrega algo
  useEffect(() => {
    if (cartCount > prevCount.current) {
      setBump(true)
      const t = setTimeout(() => setBump(false), 500)
      prevCount.current = cartCount
      return () => clearTimeout(t)
    }
    prevCount.current = cartCount
  }, [cartCount])

  const closeSearch = () => {
    onSearchChange?.('')
    setSearchOpen(false)
  }

  const goCatalog = () => {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <AnnounceBar announcement={announcement} />

      <header className={`hdr ${scrolled ? 'is-scrolled' : ''} ${searchOpen ? 'is-searching' : ''}`}>
        <div className="hdr__inner container">
          <a href="#top" className="hdr__brand" aria-label={`${brand.name}, inicio`}>
            {logo ? (
              <img src={logo} alt="" className="hdr__logo" />
            ) : (
              <span className="hdr__mark" aria-hidden="true">{initials.map((w, i) => <b key={i}>{w}</b>)}</span>
            )}
            <span className="hdr__word">{prefix} <strong>{main}</strong></span>
          </a>

          <nav className="hdr__nav" aria-label="Secciones">
            <a href="#catalogo" onClick={e => { e.preventDefault(); goCatalog() }}>Catálogo</a>
            <a href="#como-pedir">Cómo pedir</a>
            <a href="#preguntas">Preguntas</a>
          </nav>

          <div className="hdr__actions">
            <button
              className="hdr__icon"
              onClick={() => (searchOpen ? closeSearch() : setSearchOpen(true))}
              aria-label={searchOpen ? 'Cerrar búsqueda' : 'Buscar'}
              aria-expanded={searchOpen}
            >
              <Icon name={searchOpen ? 'close' : 'search'} />
            </button>

            <button className="hdr__icon hdr__bag" onClick={openCart} aria-label={`Ver pedido, ${cartCount} productos`}>
              <Icon name="cart" />
              {cartCount > 0 && <span className={`hdr__count ${bump ? 'is-bump' : ''}`}>{cartCount}</span>}
            </button>

            {canEdit ? (
              <button className="hdr__icon hdr__admin" onClick={onOpenDashboard} aria-label="Panel de administración" title="Panel de administración">
                <Icon name="settings" />
              </button>
            ) : (
              <button className="hdr__icon hdr__login" onClick={() => navigate(loginPath())} aria-label="Acceso administrador" title="Acceso administrador">
                <Icon name="user" size={20} />
              </button>
            )}
          </div>
        </div>

        <div className={`hdr__search ${searchOpen ? 'is-open' : ''}`}>
          <div className="container">
            <label className="hdr__field">
              <Icon name="search" size={18} />
              <span className="sr-only">Buscar productos</span>
              <input
                ref={inputRef}
                type="search"
                placeholder="¿Qué estás buscando?"
                value={searchTerm}
                onChange={e => onSearchChange?.(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') closeSearch(); if (e.key === 'Enter') goCatalog() }}
                tabIndex={searchOpen ? 0 : -1}
              />
            </label>
          </div>
        </div>
      </header>
    </>
  )
}

export default Header
