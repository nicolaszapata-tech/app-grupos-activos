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

export function hoyISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
