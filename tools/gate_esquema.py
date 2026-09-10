# -*- coding: utf-8 -*-
"""Compuerta ESQUEMA · Tabla 38 · Boundary 3
Ni una entidad ni una columna de más o de menos respecto del esquema físico.
Entrada: db/schema.rb (lo genera la primera migración).
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comun import *

R = Reporte('esquema', 'Tabla 38 · 19 entidades · Boundary 3')
doc = cargar('22-esquema-fisico.json')['entidades']
esperado = {e['entidad']: set(e['columnas']) for e in doc}

def sing(n):
    n = n.lower()
    for suf, rep in (('ies', 'y'), ('es', ''), ('s', '')):
        if n.endswith(suf):
            c = n[:len(n)-len(suf)] + rep
            if c in esperado: return c
    return n

ruta = os.path.join(RAIZ, 'db', 'schema.rb')
if not os.path.exists(ruta):
    R.aviso('todavía no existe db/schema.rb · la compuerta se activa con la primera migración')
    R.cerrar()

txt = leer_texto(ruta)
real = {}
for m in re.finditer(r'create_table\s+"([^"]+)"(.*?)\n  end', txt, re.S):
    tabla, cuerpo = m.group(1), m.group(2)
    cols = set(re.findall(r't\.\w+\s+"([^"]+)"', cuerpo))
    cols |= {c + '_id' for c in re.findall(r't\.references\s+"([^"]+)"', cuerpo)}
    cols.add('id')
    real[sing(tabla)] = (tabla, cols)

sobran = sorted(set(real) - set(esperado))
faltan = sorted(set(esperado) - set(real))
for t in sobran:
    R.falla('entidad que la Tabla 38 no declara: %s' % real[t][0])
if faltan:
    R.aviso('entidades comprometidas aún no migradas: %d (%s%s)'
            % (len(faltan), ', '.join(faltan[:5]), '…' if len(faltan) > 5 else ''))

for ent, cols in esperado.items():
    if ent not in real: continue
    nombre, reales = real[ent]
    tecnicas = {'created_at', 'updated_at', 'id'}
    extra = sorted(reales - cols - tecnicas)
    ausentes = sorted(cols - reales)
    for c in extra:
        R.falla('%s: columna «%s» fuera del diccionario de la Tabla 21' % (nombre, c))
    for c in ausentes:
        R.falla('%s: falta la columna «%s» que la Tabla 38 declara' % (nombre, c))

if not R.fallas:
    R.bien('%d de %d entidades migradas, sin columnas fuera del diccionario'
           % (len(real), len(esperado)))
R.cerrar()
