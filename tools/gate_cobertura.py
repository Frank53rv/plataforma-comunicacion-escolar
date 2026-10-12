# -*- coding: utf-8 -*-
"""Compuerta COBERTURA · RNF-20 · CP-RNF-20 · umbral 70 % de líneas.
Mide los dos lados: la interfaz de programación con SimpleCov y el cliente web con Jest.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comun import *

R = Reporte('cobertura', 'RNF-20 · CP-RNF-20 · ≥ 70 %')
UMBRAL = 70.0


def medir(nombre, ruta, leer, existe_el_proyecto, comando):
    """Informa la cobertura de un lado. Falta de informe con proyecto presente es falla."""
    if not os.path.exists(ruta):
        if existe_el_proyecto:
            R.falla('falta %s · generalo con:  %s' % (ruta_relativa(ruta), comando))
        else:
            R.aviso('todavía no existe %s · la compuerta se activa con él' % nombre)
        return
    try:
        with open(ruta, encoding='utf-8') as f:
            pct = leer(json.load(f))
    except Exception as e:
        R.falla('%s ilegible: %s' % (ruta_relativa(ruta), e))
        return
    if pct < UMBRAL:
        R.falla('%s: cobertura de líneas %.2f %% · por debajo del %.0f %% que RNF-20 compromete'
                % (nombre, pct, UMBRAL))
    else:
        R.bien('%s: cobertura de líneas %.2f %% (umbral %.0f %%)' % (nombre, pct, UMBRAL))


def ruta_relativa(ruta):
    return os.path.relpath(ruta, RAIZ)


medir('la interfaz',
      os.path.join(API, 'coverage', '.last_run.json'),
      lambda v: float(v['result'].get('line', v['result'].get('covered_percent'))),
      os.path.exists(os.path.join(API, 'Gemfile')),
      'corré la suite con SimpleCov')

medir('el cliente',
      os.path.join(RAIZ, 'cliente', 'coverage', 'coverage-summary.json'),
      lambda v: float(v['total']['lines']['pct']),
      os.path.exists(os.path.join(RAIZ, 'cliente', 'package.json')),
      'npm run test:cobertura')

R.cerrar()
