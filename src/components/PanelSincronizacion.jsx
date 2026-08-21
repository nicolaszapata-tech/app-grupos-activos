import { useEffect, useState } from 'react';
import { SYNCS, fetchUltimasSincronizaciones, dispararSync } from '../lib/sync.js';
import { formatearHaceTiempo } from '../lib/formato.js';

export default function PanelSincronizacion() {
  const [ultimas, setUltimas] = useState(null);
  const [enCurso, setEnCurso] = useState({});
  const [error, setError] = useState(null);

  async function recargarUltimas() {
    try {
      setUltimas(await fetchUltimasSincronizaciones());
    } catch (e) {
      setError(e.message || String(e));
    }
  }

  useEffect(() => {
    recargarUltimas();
  }, []);

  async function onClickSync(key) {
    setError(null);
    setEnCurso((prev) => ({ ...prev, [key]: true }));
    try {
      await dispararSync(key);
      await recargarUltimas();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setEnCurso((prev) => ({ ...prev, [key]: false }));
    }
  }

  return (
    <div className="mb-6 bg-ink-900 border border-ink-700 rounded-lg px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-slate-400 shrink-0">Sincronización manual</span>
        {SYNCS.map((s) => (
          <button
            key={s.key}
            type="button"
            disabled={enCurso[s.key]}
            onClick={() => onClickSync(s.key)}
            className="flex items-center gap-2 rounded-md border border-ink-600 bg-ink-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-ink-700 hover:border-ink-500 transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {enCurso[s.key] ? <IconoSpinner /> : <IconoSync />}
            <span>{s.label}</span>
            <span className="text-slate-500">
              · {ultimas ? formatearHaceTiempo(ultimas[s.key]) : '…'}
            </span>
          </button>
        ))}
      </div>
      {error && (
        <div className="mt-2 text-xs text-red-300 bg-red-950/40 border border-red-900 rounded-md px-3 py-1.5">
          {error}
        </div>
      )}
    </div>
  );
}

function IconoSync() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 shrink-0">
      <path
        d="M16 4v4h-4M4 16v-4h4M4.5 8a5.5 5.5 0 0 1 9.4-3.5L16 6M15.5 12a5.5 5.5 0 0 1-9.4 3.5L4 14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoSpinner() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5 shrink-0 animate-spin">
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" strokeOpacity="0.25" />
      <path d="M17 10a7 7 0 0 0-7-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
