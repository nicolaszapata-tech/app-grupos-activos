import { normalizar } from './normalizar.js';
import { generarSesiones, horasDelPatron, diferenciaMinutos, fechaISO, dentroDeBufferPendulo } from './pendulo.js';

const TOLERANCIA_MINUTOS = 30;

/**
 * Clasifica las grabaciones de un tutor (filas de grabaciones_calendario_pilot,
 * ya filtradas por tutor_id) contra el pendulo real de un grupo, en las 4
 * carpetas que definio el usuario (ajustado 2026-08-20c):
 *
 *  - OFICIALES:     titulo contiene el nombre de la materia Y la fecha es
 *                    una sesion real del pendulo (ya ajustada por festivo).
 *  - COINCIDENTES:  titulo NO tiene el nombre de la materia, pero la fecha
 *                    SI es una sesion real del pendulo.
 *  - ALTERNA:       titulo NO tiene el nombre de la materia, la fecha NO es
 *                    sesion del pendulo, PERO cae DENTRO del rango del grupo
 *                    (apertura->cierre) Y la hora coincide (+/-30min) con
 *                    alguna de las horas habituales del horario (no
 *                    necesariamente la de ese dia puntual -- ej. jueves a
 *                    las 6pm en un grupo LMV 6pm).
 *  - EXTRA:         titulo NO tiene el nombre de la materia, fecha NO es de
 *                    sesion, Y (la hora NO coincide con el horario aunque
 *                    este dentro del rango, O la fecha esta fuera del rango
 *                    pero a lo sumo a 15 dias de la apertura o el cierre --
 *                    ver DIAS_BUFFER_EXTRA en pendulo.js). Mas alla de ese
 *                    margen de 15 dias, NO se incluye en ninguna carpeta.
 *  - (excluida):    titulo SI tiene el nombre de la materia pero la fecha
 *                    NO es del pendulo -- probablemente una materia anterior
 *                    ya dictada; a pedido del usuario, no se incluye en
 *                    ninguna carpeta.
 *  - (lejanas):     sin nombre de materia, sin fecha de sesion, y fuera del
 *                    margen de 15 dias del rango del grupo -- se descartan,
 *                    se cuentan aparte solo para mostrar el total.
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

  const fechasSesion = new Set(sesiones.map((s) => fechaISO(s.fecha)));
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
    const fechaOk = fechasSesion.has(rec.fecha);

    if (materiaOk && fechaOk) {
      oficiales.push(rec);
    } else if (!materiaOk && fechaOk) {
      coincidentes.push(rec);
    } else if (materiaOk && !fechaOk) {
      excluidas.push(rec);
    } else {
      const dentroDeRango = grupo.aperturaIso && grupo.cierreIso && rec.fecha >= grupo.aperturaIso && rec.fecha <= grupo.cierreIso;
      const horaRec = rec.hora.slice(0, 5);
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
