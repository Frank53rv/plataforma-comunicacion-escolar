# -*- coding: utf-8 -*-
"""Compuerta TIEMPO · punto 4.2, semántica temporal · RF-33 · RN-24 · RN-32
El documento fija una única zona de interpretación y el almacenamiento en tiempo
universal. Esta compuerta impide las tres formas habituales de apartarse de eso sin
que nadie lo note: introducir otra zona, leer la hora sin zona, y comparar los
extremos de la franja de disponibilidad de manera ingenua.
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comun import *

R = Reporte('tiempo', 'punto 4.2 · semántica temporal · RF-33 · RN-24')

ZONA = 'America/Asuncion'
SPEC = os.path.join(SPECS, '25-semantica-temporal.md')

if not os.path.exists(SPEC):
    R.falla('falta specs/25-semantica-temporal.md · regenerá las specs desde el documento')
    R.cerrar()
if ZONA not in leer_texto(SPEC):
    R.falla('specs/25-semantica-temporal.md no declara la zona %s' % ZONA)

RB = tuple(archivos(('.rb',), 'api/app', 'api/lib', 'api/config', 'api/db'))

# 1 · ninguna otra zona horaria en el código
otras = {}
for p in RB:
    for m in re.finditer(r'["\']([A-Z][A-Za-z_]+(?:/[A-Za-z_+\-]+)+)["\']', leer_texto(p)):
        z = m.group(1)
        if '/' not in z or z == ZONA: continue
        if not re.match(r'^(Africa|America|Antarctica|Asia|Atlantic|Australia|Europe|Indian|Pacific)/', z):
            continue
        otras.setdefault(z, set()).add(p)
for z, ps in sorted(otras.items()):
    rel = sorted(os.path.relpath(x, RAIZ) for x in ps)[:3]
    R.falla('zona horaria «%s» ajena a la declarada · %s' % (z, ', '.join(rel)))

# 2 · la zona declarada tiene que estar configurada en alguna parte.
# Mientras la aplicación no exista, esto es un aviso y no una falla, igual que en las
# demás compuertas: se activa con el primer archivo de configuración.
if any(ZONA in leer_texto(p) for p in RB):
    R.bien('la zona %s está declarada en la configuración' % ZONA)
elif RB:
    R.falla('la zona %s no aparece en api/config/ ni en api/app/ · el punto 4.2 la exige' % ZONA)
else:
    R.aviso('todavía no existe la aplicación · la zona %s se verifica con api/config/application.rb' % ZONA)

# 3 · lectura de la hora sin zona
naive = {}
PATRONES = [r'\bTime\.now\b', r'\bDateTime\.now\b', r'\bDate\.today\b', r'\bTime\.new\b']
for p in RB:
    txt = leer_texto(p)
    for pat in PATRONES:
        for m in re.finditer(pat, txt):
            linea = txt[:m.start()].count('\n') + 1
            naive.setdefault(m.group(0), set()).add('%s:%d' % (os.path.relpath(p, RAIZ), linea))
for llamada, ubic in sorted(naive.items()):
    R.falla('%s lee la hora sin zona · usá Time.current o Time.zone · %s'
            % (llamada, ', '.join(sorted(ubic)[:3])))
if not naive and RB:
    R.bien('ninguna lectura de hora sin zona')

# 4 · la franja de disponibilidad tiene que contemplar el cruce de medianoche
franja = [p for p in RB if re.search(r'hora_inicio', leer_texto(p))]
if franja:
    cubre = False
    for p in franja:
        t = leer_texto(p)
        # una implementación correcta compara los extremos entre sí antes de decidir
        rec = r'(?:[\w.@]*\.)?'   # admite pref.hora_fin, @pref.hora_fin, hora_fin
        if re.search(rec + r'hora_fin\s*(?:<=|<)\s*' + rec + r'hora_inicio', t) or \
           re.search(rec + r'hora_inicio\s*(?:>=|>)\s*' + rec + r'hora_fin', t):
            cubre = True; break
    if cubre:
        R.bien('la franja de disponibilidad contempla el cruce de medianoche')
    else:
        R.falla('la franja se evalúa sin distinguir el caso hora_fin <= hora_inicio · '
                'specs/25-semantica-temporal.md, «cruza la medianoche» · %s'
                % ', '.join(sorted(os.path.relpath(x, RAIZ) for x in franja)[:3]))
else:
    R.aviso('todavía no hay código que evalúe hora_inicio · la franja se verifica al construir RF-33')

R.cerrar()
