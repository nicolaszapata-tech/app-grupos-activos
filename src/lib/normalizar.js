/** Sin tildes, minusculas, sin espacios de mas -- mismo criterio que
 *  normalizarTexto() en Apps Script y normalizar() en matching.py. */
export function normalizar(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Empareja el nombre de tutor de grab_programacion_grupos (tutor_calendario)
 *  contra el catalogo grab_tutores: exacto normalizado primero, si no
 *  hay match cae a subconjunto de tokens (mismo criterio que
 *  nombresDocenteCoinciden_ en 06_Cruce_Rutas.gs / buscar_grabaciones_tutor
 *  en app.py). Devuelve el registro de grab_tutores o null. */
export function emparejarTutor(nombreCalendario, catalogoTutores) {
  const objetivo = normalizar(nombreCalendario);
  if (!objetivo) return null;

  const exacto = catalogoTutores.find((t) => normalizar(t.nombre) === objetivo);
  if (exacto) return exacto;

  const tokensObjetivo = new Set(objetivo.split(' '));
  for (const t of catalogoTutores) {
    const tokensTutor = new Set(normalizar(t.nombre).split(' '));
    let subset = true;
    for (const tok of tokensObjetivo) {
      if (!tokensTutor.has(tok)) { subset = false; break; }
    }
    if (subset) return t;
  }
  return null;
}
