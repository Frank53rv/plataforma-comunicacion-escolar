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
# El trato es el mismo que el del servidor: con el proyecto presente, la falta del informe
# es una falla y no un aviso. Un aviso deja la compuerta en verde, de modo que borrar el
# archivo hacía desaparecer la verificación del cliente en silencio.
CLIENTE = os.path.join(RAIZ, 'cliente')
hay_cliente = os.path.exists(os.path.join(CLIENTE, 'package.json'))

eslint = os.path.join(CLIENTE, 'tmp', 'eslint.json')
if os.path.exists(eslint):
    try:
        resultados = json.load(open(eslint, encoding='utf-8'))
        errores = sum(r.get('errorCount', 0) + r.get('warningCount', 0) for r in resultados)
    except Exception as e:
        R.falla('cliente/tmp/eslint.json ilegible: %s' % e); R.cerrar()
    if errores:
        conteo = [r['filePath'] for r in resultados if r.get('errorCount') or r.get('warningCount')]
        R.falla('ESLint: %d hallazgos en %d archivos (p. ej. %s)'
                % (errores, len(conteo), ', '.join(os.path.basename(f) for f in conteo[:3])))
    else:
        R.bien('ESLint sin hallazgos (%d archivos)' % len(resultados))
elif hay_cliente:
    R.falla('falta cliente/tmp/eslint.json · generalo con:  npm run lint:informe')
else:
    R.aviso('todavía no existe el cliente · la compuerta se activa con él')

# El Quality Spec nombra «ESLint y Prettier»: eslint-config-prettier sólo apaga reglas de
# formato, de modo que sin esto el formato no lo verifica nadie.
formato = os.path.join(CLIENTE, 'tmp', 'prettier.txt')
if os.path.exists(formato):
    sin_formato = [l.strip() for l in leer_texto(formato).splitlines()
                   if l.strip() and not l.startswith(('Checking', 'All matched', '[warn] Code style'))]
    if sin_formato:
        R.falla('Prettier: %d archivos sin formatear (p. ej. %s)'
                % (len(sin_formato), ', '.join(s.replace('[warn] ', '') for s in sin_formato[:3])))
    else:
        R.bien('Prettier sin hallazgos')
elif hay_cliente:
    R.falla('falta cliente/tmp/prettier.txt · generalo con:  npm run formato:informe')

# --- el cliente tampoco admite excepciones por archivo (D-14) ---
if hay_cliente:
    fuentes = archivos(('.js', '.jsx'), 'cliente')
    con_excepcion = [f for f in fuentes if 'eslint-disable' in leer_texto(f)]
    if con_excepcion:
        R.falla('hay excepciones de ESLint (eslint-disable) en %d archivos: el Quality Spec no las admite'
                % len(con_excepcion))

R.cerrar()
