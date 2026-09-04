/**
 * Sistema de pendulos: mismo criterio que MACROS HE/08_Modulo_Grabaciones.gs
 * y APP_GRABACIONES/pendulo.py -- rango apertura-cierre (Fecha calendario
 * Inicio/Fin de grab_programacion_grupos) + patron de dias segun el texto exacto
 * de Horario, corriendo al siguiente dia si cae festivo (usando
 * cal_dias_habiles), y repitiendo el corrimiento si el dia siguiente
 * tambien es festivo (festivos seguidos).
 *
 * A diferencia del .gs (que solo guarda el patron de dias), aca cada dia
 * del patron tambien lleva su HORA DE INICIO -- la necesitamos para decidir
 * si una grabacion "fuera de fecha" al menos coincide en hora (Alterna) o
 * no coincide en nada (Extra). Duracion fija de 1h45m (105 min), unico dato
 * de duracion que dio el usuario ("LMV 6pm: 6pm a 7:45pm").
 */

export const DURACION_CLASE_MIN = 105;

/** dia ISO (1=Lunes..7=Domingo) -> hora de inicio "HH:MM", por texto EXACTO
 *  de Horario. Agregar aca cualquier patron nuevo que aparezca en Rutas. */
export const HORARIOS = {
  'LMV 6pm': { 1: '18:00', 3: '18:00', 5: '18:00' },
  'LMV 8pm': { 1: '20:00', 3: '20:00', 5: '20:00' },
  'MJ 6pm S 8am': { 2: '18:00', 4: '18:00', 6: '08:00' },
  'MJ 8pm S 10am': { 2: '20:00', 4: '20:00', 6: '10:00' },
};

function diaIso(date) {
  const d = date.getDay(); // 0=Domingo..6=Sabado
  return d === 0 ? 7 : d;
}

export function fechaISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "yyyy-mm-dd" -> Date local (sin desfase de zona horaria). */
export function parsearFechaISO(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Corre `fecha` al dia siguiente mientras `mapaFestivos[isoFecha]` sea
 *  true (festivo), hasta caer en habil. mapaFestivos: Map o objeto
 *  "yyyy-mm-dd" -> boolean (true = festivo). */
function ajustarPorFestivo(fecha, mapaFestivos) {
  let cursor = new Date(fecha);
  let vueltas = 0;
  while (mapaFestivos[fechaISO(cursor)] === true && vueltas < 14) {
    cursor.setDate(cursor.getDate() + 1);
    vueltas++;
  }
  return cursor;
}

/**
 * Genera las sesiones reales de un grupo dentro de [apertura, cierre]
 * (ambos Date, ambos incluidos), ya ajustadas por festivo. Devuelve
 * { sesiones: [{fecha: Date, horaHabitual: 'HH:MM'}], reconocido: boolean }.
 * reconocido=false si el texto de Horario no esta en HORARIOS.
 */
export function generarSesiones(apertura, cierre, horario, mapaFestivos) {
  const patron = HORARIOS[horario];
  if (!patron || !apertura || !cierre) return { sesiones: [], reconocido: false };

  const sesiones = [];
  const cursor = new Date(apertura);
  while (cursor <= cierre) {
    const iso = diaIso(cursor);
    if (patron[iso]) {
      const fechaAjustada = ajustarPorFestivo(cursor, mapaFestivos);
      sesiones.push({ fecha: fechaAjustada, horaHabitual: patron[iso] });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return { sesiones, reconocido: true };
}

/** Set de horas distintas ("HH:MM") que aparecen en el patron de `horario`
 *  (ej. 'MJ 6pm S 8am' -> ['18:00','08:00']). Se usa para el criterio "hora
 *  coincide" de Alterna/Extra: una grabacion en un dia que NO es sesion del
 *  pendulo (ej. jueves en un grupo LMV) igual puede "coincidir en hora" si
 *  cae en alguna de las horas habituales del grupo, sin importar que ese
 *  dia puntual no tenga clase. */
export function horasDelPatron(horario) {
  const patron = HORARIOS[horario];
  if (!patron) return [];
  return Array.from(new Set(Object.values(patron)));
}

/** Diferencia en minutos entre dos horas "HH:MM". */
export function diferenciaMinutos(horaA, horaB) {
  const [ha, ma] = horaA.split(':').map(Number);
  const [hb, mb] = horaB.split(':').map(Number);
  return Math.abs(ha * 60 + ma - (hb * 60 + mb));
}

export const DIAS_BUFFER_EXTRA = 15;

/** true si `fechaIso` ("yyyy-mm-dd") esta dentro de [aperturaIso, cierreIso]
 *  o a lo sumo a DIAS_BUFFER_EXTRA dias de cualquiera de los dos bordes
 *  (usado para el tope de la carpeta Extra: mas alla de eso, se descarta). */
export function dentroDeBufferPendulo(fechaIso, aperturaIso, cierreIso) {
  if (!aperturaIso || !cierreIso) return false;
  const apertura = parsearFechaISO(aperturaIso);
  const cierre = parsearFechaISO(cierreIso);
  const desde = new Date(apertura);
  desde.setDate(desde.getDate() - DIAS_BUFFER_EXTRA);
  const hasta = new Date(cierre);
  hasta.setDate(hasta.getDate() + DIAS_BUFFER_EXTRA);
  return fechaIso >= fechaISO(desde) && fechaIso <= fechaISO(hasta);
}
