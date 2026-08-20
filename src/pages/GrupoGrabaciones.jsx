import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchGrupoConTutor, fetchGrabacionesPorTutor, fetchMapaFestivos } from '../lib/data.js';
import { clasificarGrabaciones } from '../lib/clasificarGrabaciones.js';
import { formatearDDMMYYYY, formatearFechaLarga, formatearHora12 } from '../lib/formato.js';
import { fechaISO } from '../lib/pendulo.js';

const CARPETAS = [
  { key: 'oficiales', titulo: 'Oficiales', desc: 'Nombre de la materia + fecha del péndulo', color: 'emerald' },
  { key: 'coincidentes', titulo: 'Coincidentes', desc: 'Sin nombre de materia, fecha y hora de esa sesión', color: 'sky' },
  { key: 'alterna', titulo: 'Alterna', desc: 'Fecha distinta pero dentro del rango del grupo, hora habitual', color: 'amber' },
  { key: 'extra', titulo: 'Extra', desc: 'Fuera del rango del grupo, u hora que no coincide', color: 'rose' },
];

const COLORES = {
  emerald: 'border-emerald-800 bg-emerald-950/30 text-emerald-300',
  sky: 'border-sky-800 bg-sky-950/30 text-sky-300',
  amber: 'border-amber-800 bg-amber-950/30 text-amber-300',
  rose: 'border-rose-800 bg-rose-950/30 text-rose-300',
};

export default function GrupoGrabaciones() {
  const { idGrupo } = useParams();
  const [estado, setEstado] = useState({ cargando: true, error: null, grupo: null, tutor: null, resultado: null });

  useEffect(() => {
    let cancelado = false;
    async function cargar() {
      try {
        const { grupo, tutor } = await fetchGrupoConTutor(idGrupo);
        if (!grupo) {
          if (!cancelado) setEstado({ cargando: false, error: 'Grupo no encontrado.', grupo: null, tutor: null, resultado: null });
          return;
        }
        const [mapaFestivos, grabaciones] = await Promise.all([
          fetchMapaFestivos(),
          tutor ? fetchGrabacionesPorTutor(tutor.id) : Promise.resolve([]),
        ]);
        const resultado = clasificarGrabaciones(grupo, grabaciones, mapaFestivos);
        if (!cancelado) setEstado({ cargando: false, error: null, grupo, tutor, resultado });
      } catch (e) {
        if (!cancelado) setEstado({ cargando: false, error: e.message || String(e), grupo: null, tutor: null, resultado: null });
      }
    }
    cargar();
    return () => { cancelado = true; };
  }, [idGrupo]);

  if (estado.cargando) {
    return <div className="text-sm text-slate-400 py-10 text-center">Cargando…</div>;
  }
  if (estado.error) {
    return (
      <div>
        <VolverLink />
        <div className="rounded-lg border border-red-900 bg-red-950/40 text-red-200 px-4 py-3 text-sm mt-4">
          {estado.error}
        </div>
      </div>
    );
  }

  const { grupo, tutor, resultado } = estado;

  return (
    <div>
      <VolverLink />

      <div className="mt-4 mb-6 bg-ink-900 border border-ink-700 rounded-lg p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-50">
              {grupo.id_grupo_mapeo} — {grupo.materia || grupo.subject_name}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {grupo.horario} · {formatearDDMMYYYY(grupo.fecha_calendario_inicio)} → {formatearDDMMYYYY(grupo.fecha_calendario_fin)} · Tutor: {grupo.tutor_calendario}
            </p>
          </div>
          {!tutor && (
            <span className="text-xs text-amber-400 bg-amber-950/40 border border-amber-800 rounded-md px-2.5 py-1">
              No se encontró carpeta de Drive para "{grupo.tutor_calendario}" en el catálogo de tutores.
            </span>
          )}
        </div>

        {!resultado.reconocidoHorario && (
          <div className="mt-3 text-xs text-amber-400 bg-amber-950/40 border border-amber-800 rounded-md px-3 py-2">
            El horario "{grupo.horario}" no está en el catálogo de patrones — no se pudieron calcular las fechas de sesión.
          </div>
        )}

        {resultado.sesiones.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-medium text-slate-400 mb-2">Días de clase (péndulo, ya ajustado por festivo)</div>
            <div className="flex flex-wrap gap-2">
              {resultado.sesiones.map((s) => (
                <span key={fechaISO(s.fecha)} className="text-xs bg-ink-800 border border-ink-600 rounded-md px-2.5 py-1 text-slate-300">
                  {formatearFechaLarga(s.fecha)} · {formatearHora12(s.horaHabitual)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {tutor && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CARPETAS.map((c) => (
            <CarpetaGrabaciones
              key={c.key}
              titulo={c.titulo}
              descripcion={c.desc}
              colorClase={COLORES[c.color]}
              grabaciones={resultado[c.key]}
            />
          ))}
        </div>
      )}

      {(resultado.excluidas.length > 0 || resultado.lejanas.length > 0) && (
        <div className="mt-4 text-xs text-slate-500 space-y-1">
          {resultado.excluidas.length > 0 && (
            <div>{resultado.excluidas.length} grabación(es) con nombre de materia pero fecha fuera del péndulo no se muestran (probablemente una materia dictada antes).</div>
          )}
          {resultado.lejanas.length > 0 && (
            <div>{resultado.lejanas.length} grabación(es) sin nombre de materia y a más de 15 días del rango del grupo no se muestran.</div>
          )}
        </div>
      )}
    </div>
  );
}

function VolverLink() {
  return (
    <Link to="/" className="text-sm text-accent-400 hover:text-accent-300 inline-flex items-center gap-1">
      ← Volver a grupos activos
    </Link>
  );
}

function CarpetaGrabaciones({ titulo, descripcion, colorClase, grabaciones }) {
  return (
    <div className="border border-ink-700 rounded-lg bg-ink-900 overflow-hidden">
      <div className={`px-4 py-3 border-b ${colorClase}`}>
        <div className="text-sm font-semibold">{titulo} <span className="opacity-70 font-normal">({grabaciones.length})</span></div>
        <div className="text-xs opacity-80 mt-0.5">{descripcion}</div>
      </div>
      <div className="divide-y divide-ink-800 max-h-80 overflow-y-auto">
        {grabaciones.length === 0 && (
          <div className="px-4 py-4 text-xs text-slate-500">Sin grabaciones en esta categoría.</div>
        )}
        {grabaciones.map((g) => (
          <a
            key={g.id}
            href={g.drive_link}
            target="_blank"
            rel="noreferrer"
            className="block px-4 py-2.5 text-sm hover:bg-ink-800/60 transition-colors"
          >
            <div className="text-slate-200 truncate" title={g.titulo}>{g.titulo}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {formatearDDMMYYYY(g.fecha)} · {formatearHora12(g.hora)}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
