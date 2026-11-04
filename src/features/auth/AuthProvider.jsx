// Sesión del usuario + su perfil (rol y negocio asignado)
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { watchAuth, logout as doLogout } from '@/services/auth.service'
import { watchUserProfile, ensureSuperProfile } from '@/services/users.service'
import { PLATFORM } from '@/config/platform'
import { findTenantOwnedBy } from '@/services/tenants.service'

const Ctx = createContext(null)

// Pista local: «en este dispositivo entra el dueño de X». Solo sirve para no mostrar
// el portafolio un instante antes de llevarlo a su catálogo (la sesión real la decide Firebase).
const OWNER_HINT = 'owner-tenant'
export const ownerHint = () => { try { return localStorage.getItem(OWNER_HINT) || '' } catch { return '' } }
const setOwnerHint = (v) => { try { v ? localStorage.setItem(OWNER_HINT, v) : localStorage.removeItem(OWNER_HINT) } catch { /* sin almacenamiento */ } }

const isSuperEmail = (user) => {
  if (!user?.email) return false
  const verified = user.emailVerified || user.providerData?.some(p => p.providerId === 'google.com')
  return verified && PLATFORM.superAdmins.includes(user.email.toLowerCase())
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined)       // undefined = cargando
  const [profile, setProfile] = useState(undefined)
  const [ownedTenant, setOwnedTenant] = useState(null) // respaldo: negocio con ownerUid = esta cuenta
  const [ownedFor, setOwnedFor] = useState(null)     // cuenta (uid) para la que ya terminó esa búsqueda

  useEffect(() => watchAuth((u) => { setUser(u || null); if (!u) setProfile(null) }), [])

  useEffect(() => {
    if (!user) return
    setProfile(undefined)
    return watchUserProfile(user.uid, (p) => setProfile(p || null), () => setProfile(null))
  }, [user])

  // El super administrador queda registrado con su rol en la base de datos
  useEffect(() => {
    if (user && profile === null && isSuperEmail(user)) ensureSuperProfile(user.uid, user.email).catch(() => {})
  }, [user, profile])

  // Si el perfil no dice qué negocio tiene, se busca el negocio que la tiene como dueña
  useEffect(() => {
    setOwnedTenant(null)
    if (!user || profile === undefined || profile?.tenantId || isSuperEmail(user)) return
    let alive = true
    setOwnedFor(null)
    findTenantOwnedBy(user.uid)
      .then(id => { if (alive) setOwnedTenant(id) })
      .catch((e) => console.warn('[auth] no se pudo buscar el negocio de la cuenta', e))
      .finally(() => { if (alive) setOwnedFor(user.uid) })
    return () => { alive = false }
  }, [user, profile])

  // Mantener la pista al día: se guarda con el catálogo del dueño y se borra al cerrar sesión
  useEffect(() => {
    if (user === null) setOwnerHint('')
    else if (user && profile !== undefined && !isSuperEmail(user)) {
      const t = String(profile?.tenantId || ownedTenant || '').trim().toLowerCase()
      if (t) setOwnerHint(t)
      else if (ownedFor === user.uid) setOwnerHint('')
    }
  }, [user, profile, ownedTenant, ownedFor])

  const value = useMemo(() => {
    // Solo el correo del dueño de la plataforma (verificado) es super administrador.
    // Nunca se decide por datos que vengan de la base de datos.
    const isSuper = isSuperEmail(user)
    // Falta saber si la cuenta es dueña de algún negocio (perfil sin negocio asignado)
    const ownedPending = !!user && profile !== undefined && !profile?.tenantId && !isSuper && ownedFor !== user.uid
    // El enlace del catálogo siempre va en minúsculas (así lo lee el enrutador)
    const tenantId = String(profile?.tenantId || ownedTenant || '').trim().toLowerCase() || null
    return {
      user,
      profile,
      // «Cargando» hasta saber la sesión, el perfil y (si hace falta) el negocio de respaldo
      loading: user === undefined || (!!user && (profile === undefined || ownedPending)),
      isSuper,
      tenantId,
      canEditTenant: (slug) => !!user && (isSuper || (!!tenantId && tenantId === String(slug || '').toLowerCase())),
      logout: () => { setOwnerHint(''); return doLogout() },
    }
  }, [user, profile, ownedTenant, ownedFor])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
