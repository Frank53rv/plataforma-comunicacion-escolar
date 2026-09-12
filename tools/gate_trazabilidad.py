# -*- coding: utf-8 -*-
"""Compuerta TRAZABILIDAD · RNF-22 · CP-RNF-22
Cada requisito Must have con código citado en el código, prueba CP-RF-nn presente y rama
feature/RF-nn en el historial. Es la Tabla 15 verificada contra el repositorio.
"""
import os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comun import *

R = Reporte('trazabilidad', 'RNF-22 · CP-RNF-22 · Tabla 15')
rf = cargar('10-requisitos-funcionales.json')['requisitos']
must = [x for x in rf if x['moscow'] == 'M']
cps = {c['codigo'] for c in cargar('30-casos-prueba.json')['casos']}

src, tst = set(), set()
for p in archivos(('.rb', '.jsx', '.js', '.ts', '.tsx'), *CODIGO_API, 'cliente'):
    src |= set(re.findall(r'\bRF-\d\d\b', leer_texto(p)))
for p in archivos(('.rb', '.js', '.jsx', '.ts', '.tsx'), 'api/spec', 'cliente/tests'):
    t = leer_texto(p)
    tst |= set(re.findall(r'\bCP-RF-\d\d\b', t))

try:
    ramas = subprocess.run(['git', 'log', '--all', '--oneline', '--format=%s%d'],
                           cwd=RAIZ, capture_output=True, text=True, timeout=20).stdout
except Exception:
    ramas = ''
en_historial = set(re.findall(r'\bRF-\d\d\b', ramas))

sin_codigo = [x['codigo'] for x in must if x['codigo'] not in src]
sin_prueba = [x['codigo'] for x in must
              if x['codigo'] in src and 'CP-%s' % x['codigo'] in cps
              and 'CP-%s' % x['codigo'] not in tst]
sin_rama = [x['codigo'] for x in must if x['codigo'] in src and x['codigo'] not in en_historial]

if sin_codigo:
    R.aviso('Must have sin unidad de código que lo cite (%d): %s'
            % (len(sin_codigo), ', '.join(sin_codigo[:12]) + ('…' if len(sin_codigo) > 12 else '')))
for c in sin_prueba:
    R.falla('%s implementado sin su caso de prueba CP-%s ejecutándose' % (c, c))
for c in sin_rama:
    R.falla('%s no aparece en ningún commit ni rama · rompe la evidencia del punto 5.2' % c)
if not R.fallas:
    R.bien('%d de %d Must have con código, prueba y rama' % (len(must) - len(sin_codigo), len(must)))
R.cerrar()
