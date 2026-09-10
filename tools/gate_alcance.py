# -*- coding: utf-8 -*-
"""Compuerta ALCANCE · Boundary 1
Ningún requisito Should have se construye: la Etapa 2 resolvió que ninguno de los once
integra el alcance comprometido. La excepción exige decisión registrada y adoptada.
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comun import *

R = Reporte('alcance', 'Boundary 1 · 36 Must have, 0 Should have')
rf = cargar('10-requisitos-funcionales.json')['requisitos']
should = {x['codigo'] for x in rf if x['moscow'] == 'S'}
must = {x['codigo'] for x in rf if x['moscow'] == 'M'}

dec = leer_texto(os.path.join(SPECS, 'DECISIONES.md'))
adoptados = set(re.findall(r'adoptado:\s*(RF-\d\d)', dec))

citados = set()
for p in archivos(('.rb', '.jsx', '.js', '.ts', '.tsx'), 'app', 'lib', 'spec', 'cliente'):
    citados |= set(re.findall(r'\bRF-\d\d\b', leer_texto(p)))

# rutas Should have expuestas en el enrutador
eps = cargar('20-endpoints.json')['endpoints']
rutas_should = {}
for e in eps:
    if e['should']:
        for c in e['requisitos']:
            rutas_should[normalizar_ruta(e['ruta'])] = (e['metodo'], c)
fuente = os.path.join(RAIZ, 'tmp', 'rutas.txt')
if os.path.exists(fuente):
    for linea in leer_texto(fuente).splitlines():
        m = re.search(r'\b(GET|POST|PUT|PATCH|DELETE)\b\s+(/\S*)', linea)
        if not m or not m.group(2).startswith('/api/'): continue
        r = normalizar_ruta(m.group(2))
        if r in rutas_should and rutas_should[r][1] not in adoptados:
            R.falla('ruta Should have expuesta sin decisión adoptada: %s %s (%s)'
                    % (m.group(1), r, rutas_should[r][1]))

infractores = sorted((citados & should) - adoptados)
for c in infractores:
    tit = next(x['titulo'] for x in rf if x['codigo'] == c)
    R.falla('%s (%s) es Should have y aparece implementado sin decisión adoptada' % (c, tit))
for c in sorted(adoptados):
    R.aviso('%s adoptado por decisión registrada · verificá que el documento ya lo refleje' % c)
if not infractores:
    R.bien('ninguno de los %d Should have fue construido' % len(should))
R.bien('requisitos Must have con código citado en el árbol: %d de %d'
       % (len(citados & must), len(must)))
R.cerrar()
