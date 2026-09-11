# -*- coding: utf-8 -*-
"""Utilidades compartidas por las compuertas de verificación."""
import json, os, re, subprocess, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPECS = os.path.join(RAIZ, 'specs')
# D-06 · el árbol es el de la Figura 18: la interfaz vive en api/ y el cliente en
# cliente/. Las compuertas exploran esas rutas y no la raíz; de lo contrario no
# encontrarían nada y aprobarían por ceguera.
API = os.path.join(RAIZ, 'api')
# Figura 18 · raíces del código de la interfaz: los cinco módulos funcionales, el
# componente transversal y las carpetas propias del framework.
MODULOS = ('identidad_acceso', 'estructura_academica', 'anuncios', 'mensajeria',
           'notificaciones', 'compartido')
CODIGO_API = tuple('api/' + m for m in MODULOS) + ('api/app', 'api/lib')

def cargar(nombre):
    with open(os.path.join(SPECS, nombre), encoding='utf-8') as f:
        return json.load(f)

def normalizar_ruta(r):
    """Deja la ruta comparable: quita el formato, unifica los parámetros."""
    r = r.split('(')[0].rstrip('/')
    r = re.sub(r'\{[^}]+\}', ':p', r)      # forma del documento: {id}
    r = re.sub(r':[A-Za-z_][A-Za-z0-9_]*', ':p', r)  # forma de Rails: :id
    return r or '/'

def archivos(exts, *subdirs):
    for sd in subdirs:
        base = os.path.join(RAIZ, sd)
        for dp, dns, fns in os.walk(base):
            dns[:] = [d for d in dns if d not in ('node_modules', 'tmp', '.git', 'coverage')]
            for fn in fns:
                if fn.endswith(exts):
                    yield os.path.join(dp, fn)

class Reporte:
    def __init__(self, nombre, requisito):
        self.nombre, self.requisito = nombre, requisito
        self.fallas, self.avisos, self.ok = [], [], []
    def falla(self, t): self.fallas.append(t)
    def aviso(self, t): self.avisos.append(t)
    def bien(self, t): self.ok.append(t)
    def cerrar(self):
        cab = '  %s  ·  %s' % (self.nombre.upper(), self.requisito)
        print(cab); print('  ' + '-' * (len(cab) - 2))
        for t in self.ok:     print('    OK    ' + t)
        for t in self.avisos: print('    aviso ' + t)
        for t in self.fallas: print('    FALLA ' + t)
        estado = 'ROJO' if self.fallas else 'VERDE'
        print('    => %s\n' % estado)
        sys.exit(1 if self.fallas else 0)

def leer_texto(p):
    try:
        with open(p, encoding='utf-8', errors='replace') as f: return f.read()
    except OSError: return ''
