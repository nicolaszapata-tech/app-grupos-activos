import { normalizar } from './normalizar.js';
import { generarSesiones, horasDelPatron, diferenciaMinutos, fechaISO, dentroDeBufferPendulo } from './pendulo.js';

const TOLERANCIA_MINUTOS = 30;

/**
 * Clasifica las grabaciones de un tutor (filas de grabaciones_calendario_pilot,
 * ya filtradas por tutor_id) contra el pendulo real de un grupo, en las 4
 * carpetas que definio el usuario (ajustado 2026-08-20d):
 *
 *  - OFICIALES:     titulo contiene el nombre de la materia Y la fecha es
 *                    una sesion real del pendulo (ya ajustada por festivo).
 *  - COINCIDENTES:  titulo NO tiene el nombre de la materia, la fecha SI es
 *                    una sesion real del pendulo, Y la hora esta dentro de
 *                    tolerancia (+/-30min) de la hora habitual de ESA sesion
 *                    puntual (no de cualquier hora del patron general -- un
 *                    grupo "MJ 6pm S 8am" que tiene sesion el sabado a las
 *                    8am no cuenta como coincidente si la grabacion es ese
 *                    mismo sabado pero a las 6pm).
 *  - ALTERNA:       titulo NO tiene el nombre de la materia, Y (la fecha NO
 *                    es sesion del pendulo, O si lo es la hora no coincidio
 *                    con esa sesion puntual), PERO cae DENTRO del rango del
 *                    grupo (apertura->cierre) Y la hora coincide (+/-30min)
 *                    con alguna de las horas habituales del horario en
 *                    general (no necesariamente la de ese dia puntual --
 *                    ej. jueves a las 6pm en un grupo LMV 6pm).
 *  - EXTRA:         titulo NO tiene el nombre de la materia, no califica
 *                    para Alterna, Y (la hora NO coincide con el horario
 *                    aunque este dentro del rango, O la fecha esta fuera
 *                    del rango pero a lo sumo a 15 dias de la apertura o el
 *                    cierre -- ver DIAS_BUFFER_EXTRA en pendulo.js). Mas
 *                    alla de ese margen de 15 dias, NO se incluye en
 *                    ninguna carpeta.
 *  - (excluida):    titulo SI tiene el nombre de la materia pero la fecha
 *                    NO es del pendulo -- probablemente una materia anterior
 *                    ya dictada; a pedido del usuario, no se incluye en
 *                    ninguna carpeta.
 *  - (lejanas):     sin nombre de materia, sin fecha de sesion (o fecha de
 *                    sesion con hora que no coincide), y fuera del margen
 *                    de 15 dias del rango del grupo -- se descartan, se
 *                    cuentan aparte solo para mostrar el total.
 *
 * Devuelve { sesiones, reconocidoHorario, oficiales, coincidentes, alterna, extra, excluidas, lejanas }.
 */
export function clasificarGrabaciones(grupo, grabacionesTutor, mapaFestivos) {
  const { sesiones, reconocido } = generarSesiones(
    grupo.aperturaDate,
    grupo.cierreDate,
    grupo.horario,
    mapaFestivos
  );

  const horaHabitualPorFecha = new Map(sesiones.map((s) => [fechaISO(s.fecha), s.horaHabitual]));
  const horasHabituales = horasDelPatron(grupo.horario);
  const materiaNorm = normalizar(grupo.materia || grupo.subject_name || '');

  const oficiales = [];
  const coincidentes = [];
  const alterna = [];
  const extra = [];
  const excluidas = [];
  const lejanas = [];

  for (const rec of grabacionesTutor) {
    const tituloNorm = normalizar(rec.titulo);
    const materiaOk = materiaNorm.length > 0 && tituloNorm.includes(materiaNorm);
    const horaRec = rec.hora.slice(0, 5);
    const horaSesion = horaHabitualPorFecha.get(rec.fecha);
    const fechaEsSesion = horaSesion !== undefined;
    const horaDeSesionOk = fechaEsSesion && diferenciaMinutos(horaRec, horaSesion) <= TOLERANCIA_MINUTOS;

    if (materiaOk && fechaEsSesion) {
      oficiales.push(rec);
    } else if (materiaOk && !fechaEsSesion) {
      excluidas.push(rec);
    } else if (!materiaOk && horaDeSesionOk) {
      coincidentes.push(rec);
    } else {
      const dentroDeRango = grupo.aperturaIso && grupo.cierreIso && rec.fecha >= grupo.aperturaIso && rec.fecha <= grupo.cierreIso;
      const horaOk = horasHabituales.some((h) => diferenciaMinutos(horaRec, h) <= TOLERANCIA_MINUTOS);

      if (dentroDeRango && horaOk) {
        alterna.push(rec);
      } else if (dentroDeBufferPendulo(rec.fecha, grupo.aperturaIso, grupo.cierreIso)) {
        extra.push(rec);
      } else {
        lejanas.push(rec);
      }
    }
  }

  return { sesiones, reconocidoHorario: reconocido, oficiales, coincidentes, alterna, extra, excluidas, lejanas };
}
