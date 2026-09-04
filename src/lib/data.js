import { supabase } from './supabase.js';
import { parsearFechaISO, fechaISO } from './pendulo.js';
import { emparejarTutor } from './normalizar.js';

/** Todos los grupos de grab_programacion_grupos, con las fechas ya parseadas a
 *  Date y la fecha "efectiva" de apertura/cierre resuelta (prioriza
 *  calendario, cae a plataforma -- mismo criterio que resolverFechaPendulo_
 *  en 08_Modulo_Grabaciones.gs). */
export async function fetchTodosGrupos() {
  const { data, error } = await supabase
    .from('grab_programacion_grupos')
    .select('*')
    .order('fecha_calendario_inicio', { ascending: true })
    .order('id_grupo_mapeo', { ascending: true });
  if (error) throw error;

  return (data || []).map((g) => {
    const aperturaIso = g.fecha_calendario_inicio || g.fecha_inicio;
    const cierreIso = g.fecha_calendario_fin || g.fecha_fin;
    return {
      ...g,
      aperturaIso,
      cierreIso,
      aperturaDate: parsearFechaISO(aperturaIso),
      cierreDate: parsearFechaISO(cierreIso),
    };
  });
}

/** Grupos "activos" en `fecha` (Date): aperturaIso <= fecha <= cierreIso. */
export function filtrarGruposActivos(grupos, fecha) {
  const iso = fechaISO(fecha);
  return grupos.filter((g) => g.aperturaIso && g.cierreIso && g.aperturaIso <= iso && g.cierreIso >= iso);
}

/** Mapa "yyyy-mm-dd" -> true si es FESTIVO (de cal_dias_habiles). */
export async function fetchMapaFestivos() {
  const { data, error } = await supabase
    .from('cal_dias_habiles')
    .select('fecha, habil_o_festivo');
  if (error) throw error;

  const mapa = {};
  (data || []).forEach((r) => {
    mapa[r.fecha] = (r.habil_o_festivo || '').toUpperCase() === 'FESTIVO';
  });
  return mapa;
}

export async function fetchTutoresGrabaciones() {
  const { data, error } = await supabase
    .from('grab_tutores')
    .select('*')
    .eq('activo', true);
  if (error) throw error;
  return data || [];
}

export async function fetchGrabacionesPorTutor(tutorId) {
  if (!tutorId) return [];
  const { data, error } = await supabase
    .from('grab_calendario_pilot')
    .select('*')
    .eq('tutor_id', tutorId)
    .order('fecha', { ascending: true });
  if (error) throw error;
  return data || [];
}

/** Busca el grupo por id_grupo_mapeo y resuelve su tutor de grabaciones vía
 *  tutor_calendario -> grab_tutores (match exacto o por tokens). */
export async function fetchGrupoConTutor(idGrupoMapeo) {
  const [grupos, tutores] = await Promise.all([fetchTodosGrupos(), fetchTutoresGrabaciones()]);
  const grupo = grupos.find((g) => g.id_grupo_mapeo === idGrupoMapeo);
  if (!grupo) return { grupo: null, tutor: null };
  const tutor = emparejarTutor(grupo.tutor_calendario, tutores);
  return { grupo, tutor };
}
