import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Login from './components/Login.jsx';
import GruposActivos from './pages/GruposActivos.jsx';
import GrupoGrabaciones from './pages/GrupoGrabaciones.jsx';
import { leerSesion, cerrarSesion } from './lib/auth.js';

export default function App() {
  const [sesion, setSesion] = useState(() => leerSesion());

  if (!sesion) {
    return <Login onLogin={setSesion} />;
  }

  return (
    <Layout sesion={sesion} onCerrarSesion={() => { cerrarSesion(); setSesion(null); }}>
      <Routes>
        <Route path="/" element={<GruposActivos />} />
        <Route path="/grupo/:idGrupo" element={<GrupoGrabaciones />} />
      </Routes>
    </Layout>
  );
}
