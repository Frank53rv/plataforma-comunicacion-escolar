// RF-35 Registro agrupado de vistas · CU-10 · RN-32
// Prueba: CP-RF-35
//
// RF-35 (Tabla 10) · «El cliente debe acumular los identificadores de los anuncios que
// ingresan al área visible y emitirlos agrupados en una sola petición.»
// Observa los elementos con IntersectionObserver, junta los identificadores de publicación
// de los que entran y los emite en un solo lote cuando pasa `demora` sin novedades. Lo ya
// emitido no se repite. Sin soporte del navegador para observar, todo lo presentado se toma
// por visible. Nada de esto se guarda: la vista la registra la interfaz de programación.
export class AcumuladorDeVistas {
  #emitir;
  #demora;
  #pendientes = new Set();
  #emitidos = new Set();
  #versiones = new Map();
  #temporizador = null;
  #observador = null;

  constructor({ emitir, demora = 1500 }) {
    this.#emitir = emitir;
    this.#demora = demora;
  }

  observar(nodo, version) {
    if (!nodo || this.#versiones.has(nodo)) return;
    this.#versiones.set(nodo, version);

    if (typeof IntersectionObserver === "undefined") {
      this.#marcar(version);
      return;
    }
    this.#observador ??= new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting)
          this.#marcar(this.#versiones.get(entrada.target));
      });
    });
    this.#observador.observe(nodo);
  }

  // Emite lo pendiente en vez de perderlo, y suelta lo observado.
  cerrar() {
    this.#observador?.disconnect();
    this.#observador = null;
    this.#versiones.clear();
    this.#vaciar();
  }

  #marcar(version) {
    if (this.#emitidos.has(version) || this.#pendientes.has(version)) return;
    this.#pendientes.add(version);
    clearTimeout(this.#temporizador);
    this.#temporizador = setTimeout(() => this.#vaciar(), this.#demora);
  }

  #vaciar() {
    clearTimeout(this.#temporizador);
    this.#temporizador = null;
    if (this.#pendientes.size === 0) return;

    const lote = [...this.#pendientes];
    this.#pendientes.clear();
    lote.forEach((version) => this.#emitidos.add(version));
    this.#emitir(lote);
  }
}
