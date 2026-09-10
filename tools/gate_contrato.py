# -*- coding: utf-8 -*-
"""Compuerta CONTRATO · RNF-17 · CP-RNF-17
Diferencia nula entre el enrutador y las 43 operaciones de la Tabla 27.
Entrada: tmp/rutas.txt, producido por `bin/rails routes > tmp/rutas.txt`.
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comun import *

R = Reporte('contrato', 'RNF-17 · CP-RNF-17 · Boundary 4')
doc = cargar('20-endpoints.json')['endpoints']
esperadas = {(e['metodo'], normalizar_ruta(e['ruta'])) for e in doc if e['metodo'] != 'WSS'}
comprometidas = {(e['metodo'], normalizar_ruta(e['ruta'])) for e in doc
                 if e['metodo'] != 'WSS' and not e['should']}

fuente = os.path.join(RAIZ, 'tmp', 'rutas.txt')
if not os.path.exists(fuente):
    if os.path.exists(os.path.join(RAIZ, 'config', 'routes.rb')):
        R.falla('falta tmp/rutas.txt · generalo con:  bin/rails routes > tmp/rutas.txt')
    else:
        R.aviso('todavía no existe el enrutador · la compuerta se activa con la aplicación')
    R.cerrar()

reales = set()
for linea in leer_texto(fuente).splitlines():
    m = re.search(r'\b(GET|POST|PUT|PATCH|DELETE)\b\s+(/\S*)', linea)
    if not m: continue
    ruta = m.group(2)
    if not ruta.startswith('/api/'): continue          # sólo la interfaz versionada
    if '/rails/' in ruta or '/cable' in ruta: continue
    reales.add((m.group(1), normalizar_ruta(ruta)))

sobrantes = sorted(reales - esperadas)
faltantes = sorted(comprometidas - reales)

for m, r in sobrantes:
    R.falla('ruta que la Tabla 27 no declara: %-6s %s' % (m, r))
if faltantes:
    muestra = ', '.join('%s %s' % (m, r) for m, r in faltantes[:4])
    R.aviso('operaciones comprometidas aún no construidas: %d (p. ej. %s)'
            % (len(faltantes), muestra))
if not sobrantes:
    R.bien('ninguna ruta fuera del inventario (%d rutas expuestas)' % len(reales))
R.bien('cobertura del inventario: %d de %d operaciones Must have'
       % (len(comprometidas & reales), len(comprometidas)))
R.cerrar()
