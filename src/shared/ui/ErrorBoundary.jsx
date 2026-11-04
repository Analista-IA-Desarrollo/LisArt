// Si algo falla al dibujar la página, se muestra un aviso amable en vez de una pantalla en blanco
import { Component } from 'react'
import StatusScreen from './StatusScreen'

export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('[app]', error, info?.componentStack) }
  render() {
    if (!this.state.error) return this.props.children
    // Tras publicar una versión nueva, un archivo viejo puede no existir: recargar lo arregla
    const stale = /dynamically imported module|Loading chunk|Importing a module script failed/i.test(String(this.state.error?.message))
    return (
      <StatusScreen icon="🛠️" eyebrow="Algo salió mal" title={stale ? 'Hay una versión nueva' : 'No pudimos mostrar esta página'}
        text={stale ? 'Recarga para ver los últimos cambios.' : 'Intenta recargar. Si el problema sigue, escríbenos.'}>
        {/* Recargar conserva la dirección actual (no lleva al inicio) */}
        <button className="btn btn--primary" onClick={() => window.location.reload()}>Recargar esta página</button>
        {window.location.pathname !== '/' && <a className="btn btn--ghost" href="/">Ir al inicio</a>}
      </StatusScreen>
    )
  }
}
