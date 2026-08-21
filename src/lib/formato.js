export function formatearDDMMYYYY(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function formatearFechaLarga(date) {
  if (!date) return '—';
  const dia = DIAS[date.getDay()];
  const mes = MESES[date.getMonth()];
  const texto = `${dia} ${date.getDate()} de ${mes} de ${date.getFullYear()}`;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "HH:MM" o "HH:MM:SS" (24h) -> "H:MM AM/PM". */
export function formatearHora12(hora) {
  if (!hora) return '—';
  const [hStr, mStr] = hora.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr.padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

/** Timestamp ISO (con hora) -> "hace 5 min" / "hace 3 h" / "hace 2 d", o la
 *  fecha+hora larga si pasaron más de 7 días. null/undefined -> "nunca". */
export function formatearHaceTiempo(isoConHora) {
  if (!isoConHora) return 'nunca';
  const entonces = new Date(isoConHora);
  const diffMs = Date.now() - entonces.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'justo ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `hace ${diffD} d`;
  return entonces.toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function hoyISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
