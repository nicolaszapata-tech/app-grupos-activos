import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Login from './components/Login.jsx';
import GruposActivos from './pages/GruposActivos.jsx';
import GrupoGrabaciones from './pages/GrupoGrabaciones.jsx';
import EvaluacionDocenteForm from './pages/EvaluacionDocenteForm.jsx';
import EvaluacionDocentePanel from './pages/EvaluacionDocentePanel.jsx';
import { leerSesion, cerrarSesion } from './lib/auth.js';

export default function App() {
  return (
    <Routes>
      {/* Pública -- el formulario del estudiante NO pasa por el login de
          Google (login "suave" de staff, ver lib/auth.js). */}
      <Route path="/evaluar/:categoriaSlug/:mesSlug" element={<EvaluacionDocenteForm />} />
      <Route path="/*" element={<AreaStaff />} />
    </Routes>
  );
}

function AreaStaff() {
  const [sesion, setSesion] = useState(() => leerSesion());

  if (!sesion) {
    return <Login onLogin={setSesion} />;
  }

  return (
    <Layout sesion={sesion} onCerrarSesion={() => { cerrarSesion(); setSesion(null); }}>
      <Routes>
        <Route path="/" element={<GruposActivos />} />
        <Route path="/grupo/:idGrupo" element={<GrupoGrabaciones />} />
        <Route path="/evaluacion-docente" element={<EvaluacionDocentePanel />} />
      </Routes>
    </Layout>
  );
}
