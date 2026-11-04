// Inicio de sesión para dueños de catálogo y super administrador
import { useEffect, useState } from 'react'
import PlatformShell from '@/features/platform/PlatformShell'
import { useAuth } from './AuthProvider'
import { navigate, catalogPath, Link, safeNext } from '@/app/router'
import { PLATFORM } from '@/config/platform'
import {
  loginWithEmail, loginWithGoogle, resetPassword, registerSuperAccount, friendlyError,
} from '@/services/auth.service'
import { createTicket } from '@/services/tickets.service'
import Icon from '@/shared/ui/Icon'
import StatusScreen from '@/shared/ui/StatusScreen'

export default function LoginPage() {
  const { user, isSuper, loading, logout, tenantId } = useAuth()
  const [mode, setMode] = useState('login') // login | reset | register
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [ticketSent, setTicketSent] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [justLogged, setJustLogged] = useState(false)

  // Página a la que volver después de entrar (?next=/mi-catalogo), solo rutas internas
  const next = typeof window !== 'undefined' ? safeNext(new URLSearchParams(window.location.search).get('next')) : ''
  // ¿Puede esta cuenta abrir esa página? (el catálogo propio, o cualquiera si es super)
  const nextAllowed = !!next && (isSuper || (!!tenantId && (next === catalogPath(tenantId) || next.startsWith(`/${tenantId}?`) || next === `/${tenantId}`)))

  // Después de iniciar sesión (o si ya había sesión y llegó con ?next), llevar a cada quien a su lugar
  useEffect(() => {
    if (loading || !user) return
    if (!justLogged && !next) return
    if (nextAllowed) navigate(next, { replace: true })
    else if (isSuper) navigate('/super', { replace: true })
    else if (tenantId) navigate(catalogPath(tenantId), { replace: true })
  }, [justLogged, loading, user, isSuper, tenantId, next, nextAllowed])

  const run = async (fn) => {
    setBusy(true); setError(''); setInfo('')
    try { await fn() } catch (e) {
      console.error('[login]', e?.code || '', e)
      setError(friendlyError(e))
    } finally { setBusy(false) }
  }

  const isSuperEmail = PLATFORM.superAdmins.includes(email.trim().toLowerCase())
  // El registro de la cuenta de la plataforma solo aparece con /admin?registro (nunca a los clientes)
  const allowRegister = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('registro')
  const goMode = (m) => { setMode(m); setError(''); setInfo(''); setTicketSent(false) }

  const onSubmit = (e) => {
    e.preventDefault()
    if (mode === 'reset') {
      // El super administrador recupera su clave por correo; los dueños de catálogo
      // envían una solicitud al super administrador, que les asigna una nueva.
      if (isSuperEmail) {
        return run(async () => { await resetPassword(email); setInfo('Te enviamos un correo para crear una nueva contraseña. Revisa también la carpeta de spam.') })
      }
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Escribe el correo con el que entras a tu catálogo.')
      return run(async () => { await createTicket({ email, phone, message: note }); setTicketSent(true) })
    }
    if (mode === 'register') {
      if (!PLATFORM.superAdmins.includes(email.trim().toLowerCase())) return setError('Este registro es solo para el administrador de la plataforma.')
      return run(async () => {
        await registerSuperAccount(email, password)
        setInfo('Cuenta creada. Te enviamos un correo de verificación: ábrelo y luego vuelve a entrar.')
        setMode('login')
      })
    }
    return run(async () => { await loginWithEmail(email, password); setJustLogged(true) })
  }

  // Sesión recién iniciada: mientras se carga el perfil y se redirige, no mostrar otra vez el formulario
  const redirecting = !!user && !loading && (justLogged || !!next) && (nextAllowed || isSuper || !!tenantId)
  if (user && (loading || redirecting)) return <StatusScreen loading />

  // Ya hay una sesión abierta (o se acaba de iniciar y la cuenta no tiene catálogo asignado)
  if (user && !loading) {
    return (
      <PlatformShell title="Mi cuenta">
        <main className="pf-center">
          <div className="pf-card">
            <h1 className="display pf-title">Hola 👋</h1>
            <p className="pf-muted">Iniciaste sesión como <strong>{user.email}</strong>.</p>
            {!isSuper && !tenantId && (
              <p className="pf-alert">Tu cuenta todavía no tiene un catálogo asignado. Escríbele a quien te dio el acceso.</p>
            )}
            {isSuper && !user.emailVerified && !user.providerData?.some(p => p.providerId === 'google.com') && (
              <p className="pf-alert">Verifica tu correo (revisa tu bandeja) para activar los permisos de super administrador.</p>
            )}
            <div className="pf-actions">
              {tenantId && <button className="btn btn--primary btn--block" onClick={() => navigate(catalogPath(tenantId))}>Ir a mi catálogo</button>}
              {isSuper && <button className="btn btn--primary btn--block" onClick={() => navigate('/super')}>Panel de super administrador</button>}
              <button className="btn btn--ghost btn--block" onClick={logout}>Cerrar sesión</button>
            </div>
          </div>
        </main>
      </PlatformShell>
    )
  }

  const titles = {
    login: ['Entra a tu', 'catálogo', 'Edita productos, fotos y textos desde cualquier dispositivo.'],
    reset: ['Recupera tu', 'contraseña', 'Escribe tu correo y el administrador de la plataforma te enviará una contraseña nueva.'],
    register: ['Crea la cuenta de', 'administrador', 'Solo para el dueño de la plataforma. Luego verificarás tu correo.'],
  }[mode]

  if (ticketSent) {
    return (
      <PlatformShell title="Solicitud enviada">
        <main className="pf-center">
          <div className="pf-card" role="status">
            <p className="pf-big-icon" aria-hidden="true">📨</p>
            <h1 className="display pf-title">Solicitud <em>enviada</em></h1>
            <p className="pf-muted">
              Le avisamos al administrador. Te contactará {phone ? <>al <strong>{phone}</strong></> : 'por WhatsApp o correo'} con tu nueva contraseña.
            </p>
            <p className="pf-info">Por seguridad, nadie te pedirá tu contraseña anterior.</p>
            <div className="pf-actions">
              <button className="btn btn--primary btn--block" onClick={() => goMode('login')}>Volver a iniciar sesión</button>
              <Link to="/" className="btn btn--ghost btn--block">Ir al inicio</Link>
            </div>
          </div>
        </main>
      </PlatformShell>
    )
  }

  return (
    <PlatformShell title="Iniciar sesión">
      <main className="pf-center">
        <form className="pf-card" onSubmit={onSubmit} noValidate>
          <p className="eyebrow">{PLATFORM.name}</p>
          <h1 className="display pf-title">{titles[0]} <em>{titles[1]}</em></h1>
          <p className="pf-muted">{titles[2]}</p>

          <label className="pf-field">
            <span>Correo</span>
            <input type="email" autoComplete="email" inputMode="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" />
          </label>

          {mode !== 'reset' && (
            <label className="pf-field">
              <span>Contraseña</span>
              <span className="pf-pass">
                <input type={showPass ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(s => !s)} aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  <Icon name={showPass ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </span>
            </label>
          )}

          {mode === 'reset' && !isSuperEmail && (
            <>
              <label className="pf-field">
                <span>WhatsApp para contactarte</span>
                <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="300 123 4567" />
              </label>
              <label className="pf-field">
                <span>Mensaje (opcional)</span>
                <textarea rows={2} maxLength={500} value={note} onChange={e => setNote(e.target.value)} placeholder="Ej. Soy la dueña de Flores Ana" />
              </label>
            </>
          )}

          {error && <p className="pf-error" role="alert">{error}</p>}
          {info && <p className="pf-info" role="status">{info}</p>}

          <button className="btn btn--primary btn--block" type="submit" disabled={busy || !email || (mode !== 'reset' && password.length < 6)}>
            {busy ? 'Un momento…' : mode === 'reset' ? (isSuperEmail ? 'Enviar enlace' : 'Pedir nueva contraseña') : mode === 'register' ? 'Crear cuenta' : 'Entrar'}
          </button>

          {mode === 'login' && (
            <>
              <div className="pf-sep"><span>o</span></div>
              <button type="button" className="btn btn--ghost btn--block" disabled={busy} onClick={() => run(async () => { await loginWithGoogle(); setJustLogged(true) })}>
                <GoogleIcon /> Entrar con Google
              </button>
            </>
          )}

          <div className="pf-links">
            {mode === 'login' ? (
              <button type="button" onClick={() => goMode('reset')}>¿Olvidaste tu contraseña?</button>
            ) : (
              <button type="button" onClick={() => goMode('login')}>← Volver a iniciar sesión</button>
            )}
            {mode === 'login' && isSuperEmail && allowRegister && (
              <button type="button" onClick={() => goMode('register')}>Primera vez: crear cuenta de administrador</button>
            )}
            <Link to="/">Volver al inicio</Link>
          </div>
        </form>
      </main>
    </PlatformShell>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
