/**
 * Login "suave" del lado del cliente con Google Identity Services -- NO es
 * una barrera de seguridad real (los datos ya son de solo lectura y publicos
 * via la key publicable de Supabase, con o sin este login), es solo para que
 * la app no quede abierta a cualquiera con el link. Un usuario tecnico podria
 * saltarsela. Si mas adelante se necesita seguridad real, hay que migrar a
 * un framework con backend (ver lib/auth.ts de boletin-coursera-app, que usa
 * NextAuth con validacion de dominio en servidor).
 */

const ALLOWED_DOMAINS = ['lanuevaamerica.edu.co', 'kuepa.edu.co'];
const SESSION_KEY = 'grupos_activos_sesion';

export function dominioPermitido(email) {
  if (!email) return false;
  const dominio = email.split('@')[1]?.toLowerCase();
  return !!dominio && ALLOWED_DOMAINS.includes(dominio);
}

/** Decodifica el payload de un JWT sin verificar firma -- suficiente aca
 *  porque solo se usa para mostrar/ocultar UI, no para proteger datos. */
export function decodificarJwt(token) {
  const payload = token.split('.')[1];
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(json);
}

export function leerSesion() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const sesion = JSON.parse(raw);
    if (!sesion.email || !dominioPermitido(sesion.email)) return null;
    return sesion;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
}

export function cerrarSesion() {
  sessionStorage.removeItem(SESSION_KEY);
}
