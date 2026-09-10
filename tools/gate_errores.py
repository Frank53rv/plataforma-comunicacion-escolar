# -*- coding: utf-8 -*-
"""Compuerta ERRORES · Tabla 35 · Boundary 6
El catálogo es cerrado: ningún rechazo emite un estado que la tabla no contemple.
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _comun import *

R = Reporte('errores', 'Tabla 35 · catálogo cerrado · Boundary 6')
permitidos_error = {e['estado'] for e in cargar('21-errores.json')['estados']}
exito = {200, 201, 202, 204, 304}
SIMBOLO = {'ok':200,'created':201,'accepted':202,'no_content':204,'not_modified':304,
           'bad_request':400,'unauthorized':401,'payment_required':402,'forbidden':403,
           'not_found':404,'method_not_allowed':405,'not_acceptable':406,
           'request_timeout':408,'conflict':409,'gone':410,'precondition_failed':412,
           'payload_too_large':413,'request_entity_too_large':413,'uri_too_long':414,
           'unsupported_media_type':415,'unprocessable_entity':422,'unprocessable_content':422,
           'locked':423,'too_many_requests':429,'internal_server_error':500,
           'not_implemented':501,'bad_gateway':502,'service_unavailable':503}

hallazgos = {}
for p in archivos(('.rb',), 'api/app', 'api/lib', 'api/config'):
    txt = leer_texto(p)
    for m in re.finditer(r'status:\s*(?::([a-z_]+)|(\d{3}))', txt):
        cod = SIMBOLO.get(m.group(1)) if m.group(1) else int(m.group(2))
        if cod is None:
            hallazgos.setdefault('símbolo desconocido :%s' % m.group(1), set()).add(p); continue
        if cod in exito or cod in permitidos_error: continue
        hallazgos.setdefault(str(cod), set()).add(p)

for cod, ps in sorted(hallazgos.items()):
    rel = sorted(os.path.relpath(x, RAIZ) for x in ps)[:3]
    R.falla('estado %s fuera del catálogo · %s' % (cod, ', '.join(rel)))
if not hallazgos:
    R.bien('todos los estados emitidos pertenecen al catálogo de 9 (%s)'
           % ', '.join(str(x) for x in sorted(permitidos_error)))

# el manejador central es una exigencia del Quality Spec
manejadores = [p for p in archivos(('.rb',), 'api/app')
               if re.search(r'rescue_from|ProblemDetails|problem_details', leer_texto(p))]
if manejadores:
    R.bien('manejador central de excepciones presente (%s)'
           % os.path.relpath(manejadores[0], RAIZ))
else:
    R.aviso('no se detectó manejador central de excepciones (Quality Spec, fila «Manejo de excepciones»)')
R.cerrar()
