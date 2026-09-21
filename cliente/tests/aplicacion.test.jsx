// RF-40 Paneles diferenciados por rol · RF-01 Autenticación · RF-06 Activación · RF-43
// Sustitución de la credencial provisional · CU-01, CU-02, CU-09 · RN-04, RN-09, RN-15
// Prueba: CP-RF-40 · CP-RF-01 · CP-RF-06 · CP-RF-43
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Aplicacion from "../comun/Aplicacion.jsx";
import { panelDe, sesionDe, sesionGuardada, simularApi } from "./ayudas.js";

function abrir(ruta = "/") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Aplicacion />
    </MemoryRouter>,
  );
}

function escribir(etiqueta, valor) {
  fireEvent.change(screen.getByLabelText(etiqueta), {
    target: { value: valor },
  });
}

beforeEach(() => sessionStorage.clear());

describe("acceso sin sesión", () => {
  it("cualquier ruta lleva al ingreso", () => {
    abrir("/");

    expect(
      screen.getByRole("heading", { name: "Ingresar" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Plataforma de comunicación escolar"),
    ).toBeInTheDocument();
  });

  it("no ofrece recuperar la contraseña: RF-08 es Should have y no se construye", () => {
    abrir("/ingreso");

    expect(screen.queryByText(/olvid/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/recuper/i)).not.toBeInTheDocument();
  });
});

describe("CP-RF-01 · ingreso", () => {
  it("con credenciales válidas entra al panel, que abre en la bandeja de anuncios (RF-39)", async () => {
    const llamadas = simularApi({
      "POST /sesiones": [201, sesionDe("tutor")],
      "GET /paneles/me": [200, panelDe("tutor")],
    });
    abrir("/");

    escribir("Correo", "ana@ejemplo.test");
    escribir("Contraseña", "secreta");
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(
      await screen.findByRole("heading", { name: "Anuncios" }),
    ).toBeInTheDocument();
    expect(llamadas[0]).toMatchObject({
      clave: "POST /sesiones",
      cuerpo: { correo: "ana@ejemplo.test", contrasena: "secreta" },
    });
    expect(screen.getByText(/Ana/)).toBeInTheDocument();
    expect(screen.getByText(/Tutor/)).toBeInTheDocument();
  });

  it("un rechazo no distingue cuál de los dos datos falló (CU-01 E1)", async () => {
    simularApi({ "POST /sesiones": [401, { status: 401, detail: "x" }] });
    abrir("/ingreso");

    escribir("Correo", "nadie@ejemplo.test");
    escribir("Contraseña", "mal");
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Correo o contraseña incorrectos.",
    );
    expect(
      screen.getByRole("heading", { name: "Ingresar" }),
    ).toBeInTheDocument();
  });

  it("un dato faltante lo informa la interfaz de programación y se presenta", async () => {
    simularApi({
      "POST /sesiones": [
        422,
        { status: 422, detail: "Se requieren el correo y la contraseña." },
      ],
    });
    abrir("/ingreso");

    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Se requieren el correo y la contraseña.",
    );
  });

  it("guarda en el navegador el token y nada de lo que la persona consulta (RN-28)", async () => {
    simularApi({
      "POST /sesiones": [201, sesionDe("docente")],
      "GET /paneles/me": [200, panelDe("docente")],
    });
    abrir("/ingreso");
    escribir("Correo", "a@b");
    escribir("Contraseña", "x");
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    await screen.findByRole("heading", { name: "Anuncios" });

    expect(
      Object.keys(JSON.parse(sessionStorage.getItem("sesion"))).sort(),
    ).toEqual(["credencial_provisional", "token", "vence_en"]);
    expect(localStorage.length).toBe(0);
  });
});

describe("CP-RF-43 · credencial provisional (RN-09)", () => {
  it("hasta sustituirla, toda ruta lleva a la sustitución", async () => {
    simularApi({
      "POST /sesiones": [
        201,
        sesionDe("docente", { credencial_provisional: true }),
      ],
    });
    abrir("/ingreso");
    escribir("Correo", "a@b");
    escribir("Contraseña", "provisional");
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));

    expect(
      await screen.findByRole("heading", {
        name: "Sustituir la credencial provisional",
      }),
    ).toBeInTheDocument();
  });

  it("con la credencial provisional guardada, recargar en otra ruta sigue llevando a la sustitución", () => {
    sesionGuardada({ credencial_provisional: true });
    simularApi({});
    abrir("/");

    expect(
      screen.getByRole("heading", {
        name: "Sustituir la credencial provisional",
      }),
    ).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sustituida, la cuenta pasa al panel", async () => {
    sesionGuardada({ credencial_provisional: true });
    const llamadas = simularApi({
      "PATCH /usuarios/me/contrasena": [200, sesionDe("docente").usuario],
      "GET /paneles/me": [200, panelDe("docente")],
    });
    abrir("/");

    escribir("Contraseña actual", "provisional");
    escribir("Contraseña nueva", "una-propia-y-larga");
    fireEvent.click(
      screen.getByRole("button", { name: "Sustituir credencial" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Anuncios" }),
    ).toBeInTheDocument();
    expect(llamadas[0].cuerpo).toEqual({
      contrasena_actual: "provisional",
      contrasena_nueva: "una-propia-y-larga",
    });
    expect(
      JSON.parse(sessionStorage.getItem("sesion")).credencial_provisional,
    ).toBe(false);
  });

  it("una contraseña actual equivocada se informa y la sustitución sigue pendiente", async () => {
    sesionGuardada({ credencial_provisional: true });
    simularApi({
      "PATCH /usuarios/me/contrasena": [401, { status: 401, detail: "x" }],
    });
    abrir("/");

    escribir("Contraseña actual", "equivocada");
    escribir("Contraseña nueva", "otra");
    fireEvent.click(
      screen.getByRole("button", { name: "Sustituir credencial" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La contraseña actual no es correcta.",
    );
  });
});

describe("CP-RF-06 · activación con código", () => {
  it("activa la cuenta y entra, con su credencial ya definitiva", async () => {
    const llamadas = simularApi({
      "POST /activaciones": [201, sesionDe("alumno")],
      "GET /paneles/me": [200, panelDe("alumno")],
    });
    abrir("/activar");

    escribir("Código de activación", "ABCD-1234");
    escribir("Contraseña", "mi-clave-propia");
    fireEvent.click(screen.getByRole("button", { name: "Activar cuenta" }));

    expect(
      await screen.findByRole("heading", { name: "Anuncios" }),
    ).toBeInTheDocument();
    expect(llamadas[0].cuerpo).toEqual({
      codigo: "ABCD-1234",
      contrasena: "mi-clave-propia",
    });
  });

  it("un código vencido, usado o inexistente se presenta como tal (410)", async () => {
    simularApi({ "POST /activaciones": [410, { status: 410, detail: "x" }] });
    abrir("/activar");

    escribir("Código de activación", "MALO");
    escribir("Contraseña", "x");
    fireEvent.click(screen.getByRole("button", { name: "Activar cuenta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El código de activación venció, ya fue utilizado o no existe.",
    );
  });

  it("se llega desde el ingreso", () => {
    abrir("/ingreso");

    fireEvent.click(
      screen.getByRole("link", {
        name: "Activar cuenta con código de activación",
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Activar cuenta" }),
    ).toBeInTheDocument();
  });
});

describe("sesión", () => {
  it("recargar con un token vigente rehidrata el panel desde la interfaz, sin guardar el resto", async () => {
    sesionGuardada();
    const llamadas = simularApi({
      "GET /paneles/me": [200, panelDe("docente", { nombre: "Ana" })],
    });
    abrir("/");

    expect(
      await screen.findByRole("heading", { name: "Anuncios" }),
    ).toBeInTheDocument();
    expect(llamadas[0].cabeceras.Authorization).toBe("Bearer tok");
    expect(screen.getByText(/Docente/)).toBeInTheDocument();
  });

  it("un token vencido equivale a no tener sesión, sin esperar el 401 (RNF-02)", () => {
    sesionGuardada({ vence_en: new Date(Date.now() - 1000).toISOString() });
    simularApi({});
    abrir("/");

    expect(
      screen.getByRole("heading", { name: "Ingresar" }),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem("sesion")).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("un 401 de cualquier operación cierra la sesión y vuelve al ingreso", async () => {
    sesionGuardada();
    simularApi({ "GET /paneles/me": [401, { status: 401, detail: "x" }] });
    abrir("/");

    expect(
      await screen.findByRole("heading", { name: "Ingresar" }),
    ).toBeInTheDocument();
    expect(sessionStorage.getItem("sesion")).toBeNull();
  });

  it("cerrar sesión avisa a la interfaz, descarta el token y vuelve al ingreso", async () => {
    sesionGuardada();
    const llamadas = simularApi({
      "GET /paneles/me": [200, panelDe("tutor")],
      "DELETE /sesiones": [204],
    });
    abrir("/");
    await screen.findByRole("heading", { name: "Anuncios" });

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(
      await screen.findByRole("heading", { name: "Ingresar" }),
    ).toBeInTheDocument();
    expect(llamadas.map((l) => l.clave)).toContain("DELETE /sesiones");
    expect(sessionStorage.getItem("sesion")).toBeNull();
  });

  it("cierra la sesión aunque la interfaz no responda", async () => {
    sesionGuardada();
    simularApi({ "GET /paneles/me": [200, panelDe("tutor")] });
    abrir("/");
    await screen.findByRole("heading", { name: "Anuncios" });
    global.fetch.mockRejectedValue(new TypeError("red caída"));

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Ingresar" }),
      ).toBeInTheDocument(),
    );
  });

  it("una sesión con el panel todavía sin cargar lo indica", () => {
    sesionGuardada();
    global.fetch = jest.fn(() => new Promise(() => {}));
    abrir("/");

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });
});
