# -*- coding: utf-8 -*-
"""Compuerta ESTILO · Quality Spec, Tabla 26
«RuboCop con la configuración por defecto del framework, sin excepciones por archivo ·
Ejecución del analizador en cada envío al repositorio; el incumplimiento detiene la
integración de la rama.» Ídem ESLint para el cliente.
Entradas: api/tmp/rubocop.json y cliente/tmp/eslint.json, que producen los analizadores.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comun import *

R = Reporte('estilo', 'Quality Spec · Tabla 26 · RuboCop y ESLint')

# --- servidor ---
rubocop = os.path.join(API, 'tmp', 'rubocop.json')
if os.path.exists(rubocop):
    try:
        datos = json.load(open(rubocop, encoding='utf-8'))
        hallazgos = datos['summary']['offense_count']
        archivos_con = [f['path'] for f in datos['files'] if f['offenses']]
    except Exception as e:
        R.falla('api/tmp/rubocop.json ilegible: %s' % e); R.cerrar()
    if hallazgos:
        R.falla('RuboCop: %d hallazgos en %d archivos (p. ej. %s)'
                % (hallazgos, len(archivos_con), ', '.join(archivos_con[:3])))
    else:
        R.bien('RuboCop sin hallazgos (%d archivos inspeccionados)' % datos['summary']['inspected_file_count'])
elif os.path.exists(os.path.join(API, 'Gemfile')):
    R.falla('falta api/tmp/rubocop.json · generalo con:  bundle exec rubocop --format json --out tmp/rubocop.json')
else:
    R.aviso('todavía no existe la interfaz · la compuerta se activa con ella')

# --- configuración sin excepciones por archivo ---
cfg = leer_texto(os.path.join(API, '.rubocop.yml'))
if 'Exclude' in cfg or 'rubocop:disable' in ''.join(leer_texto(p) for p in archivos(('.rb',), *CODIGO_API, 'api/spec', 'api/config')):
    R.falla('hay excepciones de RuboCop (Exclude o rubocop:disable): el Quality Spec no las admite')

# --- cliente ---
eslint = os.path.join(RAIZ, 'cliente', 'tmp', 'eslint.json')
if os.path.exists(eslint):
    try:
        resultados = json.load(open(eslint, encoding='utf-8'))
        errores = sum(r.get('errorCount', 0) + r.get('warningCount', 0) for r in resultados)
    except Exception as e:
        R.falla('cliente/tmp/eslint.json ilegible: %s' % e); R.cerrar()
    if errores:
        R.falla('ESLint: %d hallazgos en el cliente' % errores)
    else:
        R.bien('ESLint sin hallazgos (%d archivos)' % len(resultados))
else:
    R.aviso('sin cliente/tmp/eslint.json · generalo con:  npx eslint . -f json -o tmp/eslint.json')
R.cerrar()
