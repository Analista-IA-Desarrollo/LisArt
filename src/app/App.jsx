// Punto de entrada de la aplicación: sesión + rutas
import { lazy, Suspense, useEffect } from 'react'
import { AuthProvider, useAuth, ownerHint } from '@/features/auth/AuthProvider'
import { useRoute, navigate, catalogPath } from './router'
import StatusScreen from '@/shared/ui/StatusScreen'
import ErrorBoundary from '@/shared/ui/ErrorBoundary'

// Las páginas de administración se cargan solo cuando se necesitan,
// así el catálogo abre más rápido para los clientes. El portafolio y el
// catálogo también van en archivos separados: cada visitante baja solo lo suyo.
const CatalogPage = lazy(() => import('@/features/catalog/CatalogPage'))
const PortfolioPage = lazy(() => import('@/features/portfolio/PortfolioPage'))
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const SuperAdminPage = lazy(() => import('@/features/superadmin/SuperAdminPage'))

// Fuentes por defecto solo para las pantallas que no cargan las suyas
// (el portafolio y cada catálogo traen sus propias fuentes).
const BASE_FONTS = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..700;1,400..600&family=Manrope:wght@400..800&display=swap'
function useBaseFonts(on) {
  useEffect(() => {
    if (!on || document.getElementById('base-fonts')) return
    document.head.appendChild(Object.assign(document.createElement('link'), { id: 'base-fonts', rel: 'stylesheet', href: BASE_FONTS }))
  }, [on])
}

function Routes() {
  const route = useRoute()
  useBaseFonts(route.name === 'login' || route.name === 'super')
  const { isSuper, loading, user, tenantId } = useAuth()
  // Raíz "/": si quien entra es dueño de un catálogo, se le muestra el suyo
  const ownerHome = route.name === 'home' && !isSuper && tenantId && catalogPath(tenantId) !== '/' ? catalogPath(tenantId) : ''
  useEffect(() => { if (!loading && ownerHome) navigate(ownerHome, { replace: true }) }, [loading, ownerHome])
  if (route.name === 'home') {
    // Mientras se confirma la sesión de un dueño (pista en este dispositivo), no mostrar el portafolio
    if (ownerHome || (loading && ownerHint() && user !== null)) return <StatusScreen loading />
  }
  switch (route.name) {
    case 'login': return <LoginPage />
    // El panel de super administrador ni siquiera se descarga si la cuenta no lo es
    case 'super': return loading ? <StatusScreen loading /> : isSuper ? <SuperAdminPage /> : <LoginPage />
    case 'catalog': return <CatalogPage slug={route.slug} />
    default: return <PortfolioPage />
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<StatusScreen loading />}>
          <Routes />
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  )
}
