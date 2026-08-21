import { supabase } from './supabase.js';

const WEBHOOK_BASE = import.meta.env.VITE_N8N_WEBHOOK_BASE;
const SYNC_SECRET = import.meta.env.VITE_SYNC_SECRET;

/**
 * Los 3 sync on-demand (2026-08-21) -- disparan por webhook el mismo workflow
 * de n8n que ya corre solo (cada 3h/1h), sin reemplazarlo. El webhook está
 * protegido con un header secreto (credencial "Sync Secret — App Grupos
 * Activos" en n8n) -- NO es secreto real de cara al navegador (esta app es
 * un SPA sin backend, el valor queda en el bundle), solo evita que cualquiera
 * que adivine la URL dispare el sync por accidente. Mismo nivel de
 * protección que el login de Google (ver lib/auth.js).
 */
export const SYNCS = [
  {
    key: 'programacion',
    label: 'Programación de grupos',
    webhookPath: 'sync-programacion-grupos',
    tabla: 'programacion_grupos',
    columnaFecha: 'actualizado_en',
  },
  {
    key: 'calendario',
    label: 'Calendario de días hábiles',
    webhookPath: 'sync-calendario',
    tabla: 'calendario_dias_habiles',
    columnaFecha: 'actualizado_en',
  },
  {
    key: 'grabaciones',
    label: 'Grabaciones (horario Drive)',
    webhookPath: 'sync-grabaciones-drive',
    tabla: 'grabaciones_calendario_pilot',
    columnaFecha: 'sincronizado_en',
  },
];

export async function fetchUltimasSincronizaciones() {
  const resultados = await Promise.all(
    SYNCS.map(async (s) => {
      const { data, error } = await supabase
        .from(s.tabla)
        .select(s.columnaFecha)
        .order(s.columnaFecha, { ascending: false })
        .limit(1);
      if (error) throw error;
      return [s.key, data?.[0]?.[s.columnaFecha] || null];
    })
  );
  return Object.fromEntries(resultados);
}

export async function dispararSync(key) {
  const sync = SYNCS.find((s) => s.key === key);
  if (!sync) throw new Error(`Sync desconocido: ${key}`);
  if (!WEBHOOK_BASE || !SYNC_SECRET) {
    throw new Error('Falta configurar VITE_N8N_WEBHOOK_BASE / VITE_SYNC_SECRET.');
  }
  const respuesta = await fetch(`${WEBHOOK_BASE}/${sync.webhookPath}`, {
    method: 'POST',
    headers: { 'X-Sync-Secret': SYNC_SECRET },
  });
  if (!respuesta.ok) {
    throw new Error(`El workflow respondió HTTP ${respuesta.status}.`);
  }
}
