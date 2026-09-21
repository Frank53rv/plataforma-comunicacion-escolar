// RF-33 Configuración de preferencias · RF-37 Degradación ante fallo de entrega · CU-13,
// CU-14 · RN-18, RN-24
// Prueba: CP-RF-33 · CP-RF-37
//
// TC-07, TC-20 y TC-24 (Tabla 17) · configurar el horario de disponibilidad y las preferencias
// de recepción. RF-33 · «La interfaz debe indicar de forma visible que los anuncios
// institucionales no están alcanzados por esta configuración.» RN-24 · fuera de la franja los
// mensajes se difieren, no se descartan.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { crearApi } from "../comun/api.js";
import { ContextoSesion } from "../comun/contextoSesion.js";
import {
  admiteAvisos,
  obtenerIdentificadorDeDestino,
} from "../preferencias/avisosPush.js";
import Preferencias from "../preferencias/Preferencias.jsx";
import { panelDe, simularApi } from "./ayudas.js";

jest.mock("../preferencias/avisosPush.js", () => ({
  admiteAvisos: jest.fn(),
  obtenerIdentificadorDeDestino: jest.fn(),
  nombreDelNavegador: jest.fn(() => "Firefox"),
}));

const PREFERENCIAS = "GET /usuarios/me/preferencias";
const preferencia = (extra = {}) => ({
  id: "p1",
  usuario_id: "yo",
  hora_inicio: "08:00",
  hora_fin: "18:00",
  recibir_mensajes: true,
  ...extra,
});

function dibujar(rol = "tutor") {
  const valor = {
    panel: panelDe(rol),
    sesion: { usuario_id: "yo" },
    api: crearApi({ obtenerToken: () => "tok" }),
  };
  return render(
    <ContextoSesion.Provider value={valor}>
      <MemoryRouter>
        <Preferencias />
      </MemoryRouter>
    </ContextoSesion.Provider>,
  );
}

beforeEach(() => {
  admiteAvisos.mockResolvedValue(true);
  obtenerIdentificadorDeDestino.mockResolvedValue("token-fcm");
});

describe("CP-RF-33 · horario de disponibilidad y preferencias", () => {
  it("presenta lo configurado", async () => {
    simularApi({ [PREFERENCIAS]: [200, preferencia()] });
    dibujar();

    expect(await screen.findByLabelText("Desde")).toHaveValue("08:00");
    expect(screen.getByLabelText("Hasta")).toHaveValue("18:00");
    expect(screen.getByLabelText("Recibir avisos de mensajes")).toBeChecked();
  });

  it("sin configuración previa presenta la disponibilidad permanente que la interfaz declara", async () => {
    simularApi({
      [PREFERENCIAS]: [
        200,
        { hora_inicio: "00:00", hora_fin: "00:00", recibir_mensajes: true },
      ],
    });
    dibujar();

    expect(await screen.findByLabelText("Desde")).toHaveValue("00:00");
    expect(screen.getByLabelText("Hasta")).toHaveValue("00:00");
  });

  it("declara de forma visible que los anuncios no están alcanzados por esta configuración (RN-18)", async () => {
    simularApi({ [PREFERENCIAS]: [200, preferencia()] });
    dibujar();
    await screen.findByLabelText("Desde");

    expect(
      screen.getByText(
        /Los anuncios institucionales no dependen de esta configuración/,
      ),
    ).toBeInTheDocument();
  });

  it("explica que fuera del horario los mensajes se difieren y no se pierden (RN-24)", async () => {
    simularApi({ [PREFERENCIAS]: [200, preferencia()] });
    dibujar();
    await screen.findByLabelText("Desde");

    expect(
      screen.getByText(
        /se difieren hasta que empiece el horario, no se pierden/,
      ),
    ).toBeInTheDocument();
  });

  it("explica la franja que cruza la medianoche y la disponibilidad permanente", async () => {
    simularApi({ [PREFERENCIAS]: [200, preferencia()] });
    dibujar();
    await screen.findByLabelText("Desde");

    expect(screen.getByText(/cruza la medianoche/)).toBeInTheDocument();
    expect(screen.getByText(/disponibilidad permanente/)).toBeInTheDocument();
  });

  it("guarda las tres preferencias en una sola petición y lo confirma", async () => {
    const llamadas = simularApi({
      [PREFERENCIAS]: [200, preferencia()],
      "PUT /usuarios/me/preferencias": [
        200,
        preferencia({
          hora_inicio: "09:30",
          hora_fin: "20:00",
          recibir_mensajes: false,
        }),
      ],
    });
    dibujar();
    fireEvent.change(await screen.findByLabelText("Desde"), {
      target: { value: "09:30" },
    });
    fireEvent.change(screen.getByLabelText("Hasta"), {
      target: { value: "20:00" },
    });
    fireEvent.click(screen.getByLabelText("Recibir avisos de mensajes"));

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText("Preferencias guardadas."),
    ).toBeInTheDocument();
    expect(llamadas.find((l) => l.clave.startsWith("PUT")).cuerpo).toEqual({
      hora_inicio: "09:30",
      hora_fin: "20:00",
      recibir_mensajes: false,
    });
  });

  it("un dato inaceptable lo informa la interfaz y se presenta", async () => {
    simularApi({
      [PREFERENCIAS]: [200, preferencia()],
      "PUT /usuarios/me/preferencias": [
        422,
        { status: 422, detail: "hora_inicio debe tener el formato HH:MM." },
      ],
    });
    dibujar();
    await screen.findByLabelText("Desde");

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "hora_inicio debe tener el formato HH:MM.",
    );
  });

  it("mientras guarda no admite otro guardado", async () => {
    simularApi({ [PREFERENCIAS]: [200, preferencia()] });
    dibujar();
    await screen.findByLabelText("Desde");
    global.fetch = jest.fn(() => new Promise(() => {}));

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled(),
    );
  });

  it("si no pudo cargarlas lo informa sin detalle interno", async () => {
    simularApi({ [PREFERENCIAS]: [500, { status: 500, detail: "PG::Error" }] });
    dibujar();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No fue posible completar la operación.",
    );
  });

  it("mientras llegan lo indica", () => {
    global.fetch = jest.fn(() => new Promise(() => {}));
    dibujar();

    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });

  it.each(["directivo", "docente", "tutor", "alumno"])(
    "está disponible para el rol %s",
    async (rol) => {
      simularApi({ [PREFERENCIAS]: [200, preferencia()] });
      dibujar(rol);

      expect(await screen.findByLabelText("Desde")).toBeInTheDocument();
    },
  );
});

describe("CP-RF-37 · avisos en este dispositivo", () => {
  const abrir = async () => {
    dibujar();
    await screen.findByLabelText("Desde");
  };

  it("sin soporte del navegador lo dice y explica que los avisos se ven dentro de la aplicación", async () => {
    admiteAvisos.mockResolvedValue(false);
    simularApi({ [PREFERENCIAS]: [200, preferencia()] });
    await abrir();

    expect(
      await screen.findByText(/Este navegador no admite avisos/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Activar avisos" }),
    ).not.toBeInTheDocument();
  });

  it("activar registra el identificador de destino del navegador", async () => {
    const llamadas = simularApi({
      [PREFERENCIAS]: [200, preferencia()],
      "POST /suscripciones-push": [201, { id: "s1", estado: "vigente" }],
    });
    await abrir();

    fireEvent.click(
      await screen.findByRole("button", { name: "Activar avisos" }),
    );

    expect(
      await screen.findByText("Avisos activados en este dispositivo."),
    ).toBeInTheDocument();
    expect(
      llamadas.find((l) => l.clave === "POST /suscripciones-push").cuerpo,
    ).toEqual({
      token: "token-fcm",
      navegador: "Firefox",
    });
  });

  it.each([
    [
      "permiso_denegado",
      "El navegador no concedió el permiso para mostrar avisos.",
    ],
    [
      "sin_configuracion",
      "Los avisos en este dispositivo no están configurados.",
    ],
    ["sin_soporte", "Este navegador no admite avisos."],
    ["servicio_no_disponible", "El servicio de avisos no está disponible."],
  ])(
    "si no puede obtener el identificador (%s), lo informa y los avisos siguen dentro de la aplicación",
    async (causa, texto) => {
      obtenerIdentificadorDeDestino.mockRejectedValue(
        Object.assign(new Error(causa), { causa }),
      );
      const llamadas = simularApi({ [PREFERENCIAS]: [200, preferencia()] });
      await abrir();

      fireEvent.click(
        await screen.findByRole("button", { name: "Activar avisos" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(texto);
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Los avisos se presentan dentro de la aplicación.",
      );
      expect(llamadas.some((l) => l.clave === "POST /suscripciones-push")).toBe(
        false,
      );
    },
  );

  it("un rechazo de la interfaz al registrar se presenta sin detalle interno", async () => {
    simularApi({
      [PREFERENCIAS]: [200, preferencia()],
      "POST /suscripciones-push": [500, { status: 500, detail: "PG::Error" }],
    });
    await abrir();

    fireEvent.click(
      await screen.findByRole("button", { name: "Activar avisos" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No fue posible completar la operación.",
    );
  });

  it("desactivar pide confirmación explícita antes de invalidar (RNF-14), y cancelar la retira", async () => {
    const llamadas = simularApi({ [PREFERENCIAS]: [200, preferencia()] });
    await abrir();

    fireEvent.click(
      await screen.findByRole("button", { name: "Desactivar avisos" }),
    );
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "¿Desactivar los avisos en este dispositivo?",
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(llamadas.some((l) => l.clave.startsWith("DELETE"))).toBe(false);
  });

  it("confirmada, vuelve a registrar el mismo identificador para conocer su id y lo invalida", async () => {
    const llamadas = simularApi({
      [PREFERENCIAS]: [200, preferencia()],
      "POST /suscripciones-push": [200, { id: "s1", estado: "vigente" }],
      "DELETE /suscripciones-push/s1": [200, { id: "s1", estado: "invalida" }],
    });
    await abrir();

    fireEvent.click(
      await screen.findByRole("button", { name: "Desactivar avisos" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar desactivación" }),
    );

    expect(
      await screen.findByText("Avisos desactivados en este dispositivo."),
    ).toBeInTheDocument();
    expect(
      llamadas
        .map((l) => l.clave)
        .filter((c) => c.includes("suscripciones-push")),
    ).toEqual(["POST /suscripciones-push", "DELETE /suscripciones-push/s1"]);
  });

  it("desactivar sin poder obtener el identificador lo informa", async () => {
    obtenerIdentificadorDeDestino.mockRejectedValue(
      Object.assign(new Error("x"), { causa: "permiso_denegado" }),
    );
    simularApi({ [PREFERENCIAS]: [200, preferencia()] });
    await abrir();

    fireEvent.click(
      await screen.findByRole("button", { name: "Desactivar avisos" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar desactivación" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El navegador no concedió el permiso para mostrar avisos.",
    );
  });
});
