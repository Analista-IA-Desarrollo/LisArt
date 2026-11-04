// Inicio y cierre de sesión (Firebase Authentication)
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, sendEmailVerification,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { isDemo } from './demo'

export function watchAuth(cb) {
  if (isDemo()) { setTimeout(() => cb(window.__DEMO__.user || null), 0); return () => {} }
  return onAuthStateChanged(auth, cb)
}

export const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
export const loginWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider())
export const logout = () => (isDemo() ? Promise.resolve() : signOut(auth))
export const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim())

// Solo para crear la cuenta del super administrador la primera vez
export async function registerSuperAccount(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
  await sendEmailVerification(cred.user)
  return cred.user
}

// Mensajes de error entendibles
export function authErrorMessage(err) {
  const code = err?.code || ''
  const map = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
    'auth/email-already-in-use': 'Ese correo ya tiene una cuenta.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.',
    'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
    'auth/operation-not-allowed': 'Este método de acceso no está activado. En Firebase → Authentication → Método de acceso, activa "Correo electrónico/contraseña" (y Google).',
    'auth/unauthorized-domain': 'Este dominio no está autorizado. En Firebase → Authentication → Configuración → Dominios autorizados, agrega el dominio de tu página.',
    'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permite ventanas emergentes para este sitio.',
    'auth/cancelled-popup-request': 'Cerraste la ventana de Google antes de terminar.',
    'auth/invalid-login-credentials': 'Correo o contraseña incorrectos.',
    'auth/missing-password': 'Escribe tu contraseña.',
    'auth/missing-email': 'Escribe tu correo.',
    'auth/user-disabled': 'Esta cuenta está desactivada. Escríbele al administrador de la plataforma.',
    'auth/user-token-expired': 'Tu sesión expiró. Vuelve a iniciar sesión.',
    'auth/requires-recent-login': 'Por seguridad, vuelve a iniciar sesión.',
    'auth/timeout': 'La conexión tardó demasiado. Intenta de nuevo.',
    'auth/internal-error': 'Hubo un problema de conexión con el servidor de acceso. Recarga la página e intenta de nuevo.',
    'auth/web-storage-unsupported': 'Tu navegador está bloqueando el almacenamiento del sitio (modo privado o cookies bloqueadas). Permítelo o usa otro navegador.',
    'auth/account-exists-with-different-credential': 'Ese correo ya entra con otro método (correo y contraseña o Google). Usa el método con el que te registraron.',
    'auth/invalid-api-key': 'La configuración de Firebase del sitio no es válida (VITE_FIREBASE_API_KEY). Revisa las variables en Vercel.',
    'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'La configuración de Firebase del sitio no es válida (VITE_FIREBASE_API_KEY). Revisa las variables en Vercel.',
  }
  if (map[code]) return map[code]
  // Código desconocido: se muestra para poder diagnosticarlo
  return code ? `No pudimos iniciar sesión (${code}). Intenta de nuevo.` : 'Ocurrió un error. Intenta de nuevo.'
}

// Mensaje entendible para cualquier error de Firebase (sesión o base de datos)
export function friendlyError(err, fallback = 'Ocurrió un error. Intenta de nuevo.') {
  const code = err?.code || ''
  if (code.startsWith('auth/')) return authErrorMessage(err)
  if (code === 'permission-denied' || code === 'firestore/permission-denied') {
    return 'Firestore no dio permiso. Revisa que pegaste y PUBLICASTE las reglas de firestore.rules en el proyecto correcto.'
  }
  if (code === 'unavailable') return 'Sin conexión con la base de datos. Revisa tu internet.'
  if (code === 'not-found' && /database/i.test(err?.message || '')) return 'No existe la base de datos Firestore en este proyecto. Créala en Firebase → Firestore Database.'
  if (err?.message === 'exists') return 'Ya existe un catálogo con ese enlace.'
  return fallback
}
