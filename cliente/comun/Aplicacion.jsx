// RF-40 Paneles diferenciados por rol · RF-01 · RF-06 · RF-43 · CU-01, CU-02, CU-09 · RN-04,
// RN-09, RN-15
// Prueba: CP-RF-40 · CP-RF-01 · CP-RF-06 · CP-RF-43
//
// Fig. 13 · aplicación de página única. Rutas públicas —ingreso y activación—, la
// sustitución de la credencial y, tras la autenticación, el armazón con las secciones del
// rol. El enrutador lo aporta quien monta la aplicación (el navegador o una prueba).
import { Navigate, Outlet, Route, Routes } from "react-router";
import Activacion from "./Activacion.jsx";
import Armazon from "./Armazon.jsx";
import Ingreso from "./Ingreso.jsx";
import SesionProvider from "./SesionProvider.jsx";
import SustitucionDeCredencial from "./SustitucionDeCredencial.jsx";
import { SECCIONES } from "./secciones.js";
import { useSesion } from "./contextoSesion.js";

// RN-09 · hasta sustituir la credencial provisional, toda ruta lleva a la sustitución.
function RutaProtegida() {
  const { sesion } = useSesion();
  if (!sesion) return <Navigate to="/ingreso" replace />;
  if (sesion.credencial_provisional)
    return <Navigate to="/credencial" replace />;
  return <Outlet />;
}

export default function Aplicacion() {
  return (
    <SesionProvider>
      <Routes>
        <Route path="/ingreso" element={<Ingreso />} />
        <Route path="/activar" element={<Activacion />} />
        <Route path="/credencial" element={<SustitucionDeCredencial />} />
        <Route element={<RutaProtegida />}>
          <Route element={<Armazon />}>
            {Object.values(SECCIONES).map((seccion) => {
              const Pantalla = seccion.elemento;
              return (
                <Route
                  key={seccion.ruta}
                  path={seccion.ruta}
                  element={<Pantalla />}
                />
              );
            })}
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SesionProvider>
  );
}
