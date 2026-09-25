// RF-31 Notificación de anuncios · CU-06, CU-14 · RN-18
// Prueba: CP-RF-31
//
// Tabla 23 · el manifiesto y el service worker propios «hacen instalable el cliente,
// condición de la recepción en iOS según el riesgo R-03». Se verifica que la instalación se
// ofrezca cuando el navegador la admite, que iOS reciba la indicación de la vía manual, y
// que instalada la aplicación el ofrecimiento desaparezca.
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import BotonDeInstalacion from "../comun/BotonDeInstalacion.jsx";
import { esIOS, estaInstalada } from "../comun/instalacion.js";

const AGENTE_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";

function conNavegador({ agente = "Chrome/120", standalone = false }) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", {
    value: { ...globalThis.navigator, userAgent: agente, standalone },
    configurable: true,
  });
  return () => Object.defineProperty(globalThis, "navigator", original);
}

function ofrecer() {
  const suceso = new Event("beforeinstallprompt");
  suceso.prompt = jest.fn().mockResolvedValue({ outcome: "accepted" });
  act(() => void globalThis.dispatchEvent(suceso));
  return suceso;
}

const boton = () => screen.queryByRole("button", { name: "Instalar aplicación" });

describe("ofrecimiento de instalación del cliente", () => {
  let restaurar = () => {};
  afterEach(() => restaurar());

  it("no ofrece nada mientras el navegador no ofrezca instalar", () => {
    restaurar = conNavegador({});
    render(<BotonDeInstalacion />);

    expect(boton()).not.toBeInTheDocument();
  });

  it("ofrece la instalación cuando el navegador la admite y la invoca al pulsarla", async () => {
    restaurar = conNavegador({});
    render(<BotonDeInstalacion />);
    const suceso = ofrecer();

    await act(async () => void fireEvent.click(boton()));

    expect(suceso.prompt).toHaveBeenCalled();
    // Invocado el ofrecimiento, el navegador no lo repite: el botón deja de tener sentido.
    await waitFor(() => expect(boton()).not.toBeInTheDocument());
  });

  it("en iOS indica la vía del menú de compartir, que es la única (R-03)", async () => {
    restaurar = conNavegador({ agente: AGENTE_IOS });
    render(<BotonDeInstalacion />);

    await act(async () => void fireEvent.click(boton()));

    expect(screen.getByRole("status")).toHaveTextContent(
      /Agregar a pantalla de inicio/,
    );
  });

  it("instalada la aplicación, el ofrecimiento desaparece", () => {
    restaurar = conNavegador({ agente: AGENTE_IOS, standalone: true });
    render(<BotonDeInstalacion />);

    expect(boton()).not.toBeInTheDocument();
  });

  it("deja de ofrecer en cuanto el navegador avisa que se instaló", async () => {
    restaurar = conNavegador({});
    render(<BotonDeInstalacion />);
    ofrecer();
    expect(boton()).toBeInTheDocument();

    act(() => void globalThis.dispatchEvent(new Event("appinstalled")));

    await waitFor(() => expect(boton()).not.toBeInTheDocument());
  });

  it("reconoce la aplicación ya instalada por el modo de presentación", () => {
    restaurar = conNavegador({});
    const original = globalThis.matchMedia;
    globalThis.matchMedia = jest.fn().mockReturnValue({ matches: true });

    expect(estaInstalada()).toBe(true);
    expect(esIOS(AGENTE_IOS)).toBe(true);

    globalThis.matchMedia = original;
  });
});
