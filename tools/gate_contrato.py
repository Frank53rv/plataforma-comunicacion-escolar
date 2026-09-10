# -*- coding: utf-8 -*-
"""Compuerta CONTRATO · RNF-17 · CP-RNF-17
Diferencia nula en los tres sentidos que el caso de prueba exige: rutas del enrutador,
archivo OpenAPI e inventario de la Tabla 27.
Entrada: api/tmp/rutas.txt, producido por `bin/rails routes > tmp/rutas.txt`.
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comun import *

R = Reporte('contrato', 'RNF-17 · CP-RNF-17 · Boundary 4')
doc = cargar('20-endpoints.json')['endpoints']
esperadas = {(e['metodo'], normalizar_ruta(e['ruta'])) for e in doc if e['metodo'] != 'WSS'}
comprometidas = {(e['metodo'], normalizar_ruta(e['ruta'])) for e in doc
                 if e['metodo'] != 'WSS' and not e['should']}

fuente = os.path.join(API, 'tmp', 'rutas.txt')
if not os.path.exists(fuente):
    if os.path.exists(os.path.join(API, 'config', 'routes.rb')):
        R.falla('falta api/tmp/rutas.txt · generalo con:  bin/rails routes > tmp/rutas.txt')
    else:
        R.aviso('todavía no existe el enrutador · la compuerta se activa con la aplicación')
    R.cerrar()

# --- segundo sentido · el archivo OpenAPI contra la Tabla 27 ---
openapi = os.path.join(RAIZ, 'openapi', 'openapi.yaml')
if not os.path.exists(openapi):
    R.falla('falta openapi/openapi.yaml · RNF-17 exige la interfaz descrita en ese formato')
else:
    txt_api = leer_texto(openapi)
    documentadas, ruta_actual = set(), None
    for linea in txt_api.splitlines():
        m = re.match(r'^  (/\S*):\s*$', linea)
        if m:
            ruta_actual = m.group(1); continue
        m = re.match(r'^    (get|post|put|patch|delete):\s*$', linea)
        if m and ruta_actual:
            documentadas.add((m.group(1).upper(), normalizar_ruta('/api/v1' + ruta_actual)))
    sobran_doc = sorted(documentadas - esperadas)
    faltan_doc = sorted(esperadas - documentadas)
    for m, r in sobran_doc:
        R.falla('el OpenAPI describe una operación que la Tabla 27 no declara: %-6s %s' % (m, r))
    for m, r in faltan_doc:
        R.falla('el OpenAPI no describe la operación %-6s %s de la Tabla 27' % (m, r))
    if not sobran_doc and not faltan_doc:
        R.bien('OpenAPI ↔ Tabla 27: diferencia nula (%d operaciones descritas)' % len(documentadas))

# --- tercer sentido · el enrutador ---
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
if 'documentadas' in dir():
    sin_documentar = sorted(reales - documentadas)
    for m, r in sin_documentar:
        R.falla('ruta expuesta que el OpenAPI no describe: %-6s %s' % (m, r))
    if reales and not sin_documentar:
        R.bien('enrutador ↔ OpenAPI: diferencia nula')
R.cerrar()
