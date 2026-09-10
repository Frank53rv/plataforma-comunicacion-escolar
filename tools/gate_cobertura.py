# -*- coding: utf-8 -*-
"""Compuerta COBERTURA · RNF-20 · CP-RNF-20 · umbral 70 % de líneas de la interfaz."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comun import *

R = Reporte('cobertura', 'RNF-20 · CP-RNF-20 · ≥ 70 %')
UMBRAL = 70.0
p = os.path.join(API, 'coverage', '.last_run.json')
if not os.path.exists(p):
    R.aviso('sin api/coverage/.last_run.json · corré la suite con SimpleCov antes de integrar')
    R.cerrar()
try:
    v = json.load(open(p, encoding='utf-8'))['result']
    pct = float(v.get('line', v.get('covered_percent')))
except Exception as e:
    R.falla('api/coverage/.last_run.json ilegible: %s' % e); R.cerrar()
if pct < UMBRAL:
    R.falla('cobertura de líneas %.2f %% · por debajo del %.0f %% que RNF-20 compromete' % (pct, UMBRAL))
else:
    R.bien('cobertura de líneas %.2f %% (umbral %.0f %%)' % (pct, UMBRAL))
R.cerrar()
