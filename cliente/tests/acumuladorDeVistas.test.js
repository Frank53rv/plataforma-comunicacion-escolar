// RF-35 Registro agrupado de vistas · CU-10 · RN-32
// Prueba: CP-RF-35
//
// RF-35 (Tabla 10) · «El cliente debe acumular los identificadores de los anuncios que
// ingresan al área visible y emitirlos agrupados en una sola petición.»
import { AcumuladorDeVistas } from "../anuncios/acumuladorDeVistas.js";

class ObservadorFalso {
  constructor(alEntrar) {
    this.alEntrar = alEntrar;
    this.nodos = [];
    this.desconectado = false;
    ObservadorFalso.ultimo = this;
  }
  observe(nodo) {
    this.nodos.push(nodo);
  }
  disconnect() {
    this.desconectado = true;
  }
  entrar(...nodos) {
    this.alEntrar(nodos.map((target) => ({ isIntersecting: true, target })));
  }
  salir(...nodos) {
    this.alEntrar(nodos.map((target) => ({ isIntersecting: false, target })));
  }
}

const nodo = () => document.createElement("li");

describe("acumulador de vistas", () => {
  let emitir;

  beforeEach(() => {
    jest.useFakeTimers();
    emitir = jest.fn();
    global.IntersectionObserver = ObservadorFalso;
  });

  afterEach(() => {
    jest.useRealTimers();
    delete global.IntersectionObserver;
  });

  it("acumula lo que entra al área visible y lo emite junto, en una sola petición", () => {
    const acumulador = new AcumuladorDeVistas({ emitir, demora: 1000 });
    const [a, b, c] = [nodo(), nodo(), nodo()];
    acumulador.observar(a, "va");
    acumulador.observar(b, "vb");
    acumulador.observar(c, "vc");

    ObservadorFalso.ultimo.entrar(a);
    jest.advanceTimersByTime(400);
    ObservadorFalso.ultimo.entrar(b);
    jest.advanceTimersByTime(999);
    expect(emitir).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);

    expect(emitir).toHaveBeenCalledTimes(1);
    expect(emitir).toHaveBeenCalledWith(["va", "vb"]);
  });

  it("lo que no entró al área visible no se emite", () => {
    const acumulador = new AcumuladorDeVistas({ emitir, demora: 1000 });
    const a = nodo();
    acumulador.observar(a, "va");

    ObservadorFalso.ultimo.salir(a);
    jest.advanceTimersByTime(5000);

    expect(emitir).not.toHaveBeenCalled();
  });

  it("no vuelve a emitir un anuncio ya emitido, ni lo repite dentro del mismo lote", () => {
    const acumulador = new AcumuladorDeVistas({ emitir, demora: 1000 });
    const a = nodo();
    acumulador.observar(a, "va");

    ObservadorFalso.ultimo.entrar(a);
    ObservadorFalso.ultimo.entrar(a);
    jest.advanceTimersByTime(1000);
    ObservadorFalso.ultimo.entrar(a);
    jest.advanceTimersByTime(1000);

    expect(emitir).toHaveBeenCalledTimes(1);
    expect(emitir).toHaveBeenCalledWith(["va"]);
  });

  it("al cerrarse emite lo que quedó pendiente en vez de perderlo, y desconecta", () => {
    const acumulador = new AcumuladorDeVistas({ emitir, demora: 1000 });
    const a = nodo();
    acumulador.observar(a, "va");
    ObservadorFalso.ultimo.entrar(a);

    acumulador.cerrar();

    expect(emitir).toHaveBeenCalledWith(["va"]);
    expect(ObservadorFalso.ultimo.desconectado).toBe(true);
    jest.advanceTimersByTime(5000);
    expect(emitir).toHaveBeenCalledTimes(1);
  });

  it("cerrarse sin nada pendiente no emite", () => {
    const acumulador = new AcumuladorDeVistas({ emitir });

    acumulador.cerrar();

    expect(emitir).not.toHaveBeenCalled();
  });

  it("observar el mismo nodo otra vez, o un nodo nulo, no rompe nada", () => {
    const acumulador = new AcumuladorDeVistas({ emitir, demora: 1000 });
    const a = nodo();

    acumulador.observar(null, "va");
    acumulador.observar(a, "va");
    acumulador.observar(a, "va");

    expect(ObservadorFalso.ultimo.nodos).toEqual([a]);
  });

  it("sin soporte del navegador para observar, todo lo presentado se toma por visible", () => {
    delete global.IntersectionObserver;
    const acumulador = new AcumuladorDeVistas({ emitir, demora: 1000 });

    acumulador.observar(nodo(), "va");
    acumulador.observar(nodo(), "vb");
    jest.advanceTimersByTime(1000);

    expect(emitir).toHaveBeenCalledWith(["va", "vb"]);
  });
});
