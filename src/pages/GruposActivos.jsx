import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTodosGrupos, filtrarGruposActivos } from '../lib/data.js';
import { formatearDDMMYYYY, hoyISO } from '../lib/formato.js';
import { normalizar } from '../lib/normalizar.js';
import PanelSincronizacion from '../components/PanelSincronizacion.jsx';
import Combobox from '../components/Combobox.jsx';

export default function GruposActivos() {
  const [grupos, setGrupos] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);

  const [fechaInicioFiltro, setFechaInicioFiltro] = useState(null);
  const [categoria, setCategoria] = useState('TODAS');
  const [groupIdFiltro, setGroupIdFiltro] = useState('');
  const [tutorFiltro, setTutorFiltro] = useState('');
  const [materiaFiltro, setMateriaFiltro] = useState('');

  useEffect(() => {
    fetchTodosGrupos()
      .then(setGrupos)
      .catch((e) => setErrorCarga(e.message || String(e)));
  }, []);

  const categorias = useMemo(() => {
    if (!grupos) return [];
    return Array.from(new Set(grupos.map((g) => g.categoria_programa).filter(Boolean))).sort();
  }, [grupos]);

  const tutores = useMemo(() => {
    if (!grupos) return [];
    return Array.from(new Set(grupos.map((g) => g.tutor_calendario).filter(Boolean))).sort();
  }, [grupos]);

  const materias = useMemo(() => {
    if (!grupos) return [];
    return Array.from(new Set(grupos.map((g) => g.materia || g.subject_name).filter(Boolean))).sort();
  }, [grupos]);

  const hayFiltroEspecifico = !!(groupIdFiltro.trim() || tutorFiltro.trim() || materiaFiltro.trim());

  const filtrados = useMemo(() => {
    if (!grupos) return [];
    let lista;
    if (fechaInicioFiltro) {
      lista = grupos.filter((g) => g.aperturaIso === fechaInicioFiltro);
    } else if (hayFiltroEspecifico) {
      // Buscar por Group ID/Tutor/Materia es una búsqueda puntual -- no debe
      // quedar oculta por la ventana de "activos hoy" (2026-08-25, bug
      // reportado: una materia que sí existe en la data, pero cuyo grupo ya
      // no está activo hoy, daba "No hay grupos activos con estos filtros"
      // aunque el combobox la mostrara como opción -- el combobox lista TODOS
      // los grupos, no solo los de hoy).
      lista = grupos;
    } else {
      lista = filtrarGruposActivos(grupos, new Date(hoyISO() + 'T00:00:00'));
    }
    if (categoria !== 'TODAS') lista = lista.filter((g) => g.categoria_programa === categoria);
    if (groupIdFiltro.trim()) {
      const q = groupIdFiltro.trim().toLowerCase();
      lista = lista.filter((g) => (g.group_id || '').toLowerCase().includes(q));
    }
    if (tutorFiltro.trim()) {
      const q = normalizar(tutorFiltro);
      lista = lista.filter((g) => normalizar(g.tutor_calendario || '').includes(q));
    }
    if (materiaFiltro.trim()) {
      const q = normalizar(materiaFiltro);
      lista = lista.filter((g) => normalizar(g.materia || g.subject_name || '').includes(q));
    }
    return lista;
  }, [grupos, fechaInicioFiltro, categoria, groupIdFiltro, tutorFiltro, materiaFiltro, hayFiltroEspecifico]);

  if (errorCarga) {
    return (
      <div className="rounded-lg border border-red-900 bg-red-950/40 text-red-200 px-4 py-3 text-sm">
        Error cargando datos de Supabase: {errorCarga}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-50">Grupos activos</h1>
        <p className="text-sm text-slate-400 mt-1">
          {fechaInicioFiltro
            ? `Grupos que iniciaron el ${formatearDDMMYYYY(fechaInicioFiltro)}.`
            : hayFiltroEspecifico
              ? 'Buscando por Group ID / Tutor / Materia en todos los grupos (no solo los activos hoy).'
              : 'Por defecto: grupos activos hoy. Selecciona una fecha para ver solo los que iniciaron ese día.'}
        </p>
      </div>

      <PanelSincronizacion />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6 bg-ink-900 border border-ink-700 rounded-lg p-4">
        <Filtro label="Fecha de inicio">
          <div className="relative">
            <input
              type="date"
              value={fechaInicioFiltro || ''}
              onChange={(e) => setFechaInicioFiltro(e.target.value || null)}
              className="w-full bg-ink-800 border border-ink-600 rounded-full px-3 py-2 pr-8 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
            />
            {fechaInicioFiltro && (
              <button
                type="button"
                onClick={() => setFechaInicioFiltro(null)}
                title="Quitar filtro de fecha (volver a activos hoy)"
                aria-label="Quitar filtro de fecha"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-100 hover:bg-ink-700"
              >
                ×
              </button>
            )}
          </div>
        </Filtro>
        <Filtro label="Categoría">
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full bg-ink-800 border border-ink-600 rounded-full px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-colors"
          >
            <option value="TODAS">Todas</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Filtro>
        <Filtro label="Group ID">
          <Combobox
            value={groupIdFiltro}
            onChange={setGroupIdFiltro}
            options={[]}
            placeholder="Buscar Group ID..."
          />
        </Filtro>
        <Filtro label="Tutor calendario">
          <Combobox
            value={tutorFiltro}
            onChange={setTutorFiltro}
            options={tutores}
            placeholder="Escribir o elegir tutor..."
          />
        </Filtro>
        <Filtro label="Materia">
          <Combobox
            value={materiaFiltro}
            onChange={setMateriaFiltro}
            options={materias}
            placeholder="Escribir o elegir materia..."
          />
        </Filtro>
      </div>

      {grupos === null ? (
        <div className="text-sm text-slate-400 py-10 text-center">Cargando grupos…</div>
      ) : (
        <>
          <div className="text-xs text-slate-400 mb-2">
            {filtrados.length} grupo(s) {fechaInicioFiltro ? 'iniciado(s) esa fecha' : hayFiltroEspecifico ? 'encontrado(s)' : 'activo(s) hoy'}
          </div>
          <div className="rounded-lg border border-ink-700">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[8%]" />
                <col className="w-[4%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[9%]" />
                <col className="w-[18%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[7.5%]" />
                <col className="w-[7.5%]" />
              </colgroup>
              <thead className="bg-ink-900 text-slate-300">
                <tr>
                  <Th>ID Grupo</Th>
                  <Th />
                  <Th>Group ID</Th>
                  <Th>Section ID</Th>
                  <Th>Categoría</Th>
                  <Th>Materia</Th>
                  <Th>Tutor Calendario</Th>
                  <Th>Horario</Th>
                  <Th>Fecha Inicio</Th>
                  <Th>Fecha Fin</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {filtrados.map((g) => (
                  <tr key={g.group_id} className="hover:bg-ink-900/60 transition-colors">
                    <Td className="font-medium text-slate-100" title={g.id_grupo_mapeo}>{g.id_grupo_mapeo}</Td>
                    <Td className="text-center">
                      <Link
                        to={`/grupo/${encodeURIComponent(g.id_grupo_mapeo)}`}
                        title="Ver grabaciones"
                        aria-label="Ver grabaciones"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-accent-500/15 text-accent-400 border border-accent-500/30 hover:bg-accent-500/25 transition-colors"
                      >
                        <IconoCarpeta />
                      </Link>
                    </Td>
                    <Td className="text-slate-400 text-xs" title={g.group_id}>{g.group_id}</Td>
                    <Td className="text-slate-400 text-xs" title={g.section_id}>{g.section_id}</Td>
                    <Td title={g.categoria_programa}>{g.categoria_programa}</Td>
                    <Td title={g.materia}>{g.materia}</Td>
                    <Td title={g.tutor_calendario}>{g.tutor_calendario}</Td>
                    <Td title={g.horario}>{g.horario}</Td>
                    <Td>{formatearDDMMYYYY(g.fecha_calendario_inicio)}</Td>
                    <Td>{formatearDDMMYYYY(g.fecha_calendario_fin)}</Td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center text-slate-500 py-8 text-sm">
                      No hay grupos con estos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Filtro({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Th({ children }) {
  return <th className="text-left font-medium px-3 py-2.5 truncate">{children}</th>;
}

function IconoCarpeta() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
      <path
        d="M2.5 5.5c0-.552.448-1 1-1h4.086c.265 0 .52.105.707.293l1.414 1.414a1 1 0 0 0 .707.293H16.5c.552 0 1 .448 1 1v7c0 .552-.448 1-1 1h-13c-.552 0-1-.448-1-1v-9Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Td({ children, className = '', title }) {
  return (
    <td className={`px-3 py-2.5 truncate overflow-hidden ${className}`} title={title}>
      {children}
    </td>
  );
}
