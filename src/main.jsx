import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app/App'
import './styles/global.css'
import './styles/app.css'
import { startVitals } from '@/lib/vitals'

// Tras publicar una versión nueva, una pestaña abierta puede pedir archivos que ya no existen.
// Se recarga la MISMA página una sola vez (no se manda al inicio).
window.addEventListener('vite:preloadError', (e) => {
  try {
    const key = 'reload-after-deploy'
    const last = Number(sessionStorage.getItem(key) || 0)
    if (Date.now() - last < 30e3) return
    sessionStorage.setItem(key, String(Date.now()))
    e.preventDefault()
    window.location.reload()
  } catch { /* sin sessionStorage: se muestra el aviso normal */ }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

startVitals()
