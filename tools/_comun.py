# -*- coding: utf-8 -*-
"""Utilidades compartidas por las compuertas de verificación."""
import json, os, re, subprocess, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPECS = os.path.join(RAIZ, 'specs')
# D-06 · la interfaz vive en api/ y el cliente en cliente/. Las compuertas exploran esas
# rutas y no la raíz; de lo contrario no encontrarían nada y aprobarían por ceguera.
API = os.path.join(RAIZ, 'api')
# D-21 · los cinco módulos funcionales y el componente transversal son carpetas bajo
# api/app/. La divergencia D-03 de la Tabla 38 resuelve que se corrige la Figura 18 y no
# el código, de modo que api/app las contiene a todas y basta con explorar esa raíz.
MODULOS = ('identidad_acceso', 'estructura_academica', 'anuncios', 'mensajeria',
           'notificaciones', 'compartido')
CODIGO_API = ('api/app', 'api/lib')

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

# D-26 · mismo defecto que D-05 resolvió sobre el flag `should`: una coincidencia de
# subcadena sobre el archivo entero no distingue el código que una unidad REALIZA
# (CLAUDE.md §4: el comentario de encabezado con los códigos que realiza) de un código
# apenas MENCIONADO en la prosa posterior para acotar un límite de alcance —«RF-18 es
# Should have y no se construye acá»—, que es precisamente el tipo de nota que evita
# inventar un comportamiento no especificado. El encabezado es el bloque de comentario
# inicial del archivo hasta la línea «# Prueba: …» inclusive, tal como lo fijan los
# ejemplos de CLAUDE.md §4 y los archivos ya integrados.
def rf_realizados(texto):
    encabezado = []
    for linea in texto.splitlines():
        recorte = linea.strip()
        if recorte and not recorte.startswith('#'):
            break
        encabezado.append(linea)
        if re.match(r'#\s*Prueba:', recorte):
            break
    return set(re.findall(r'\bRF-\d\d\b', '\n'.join(encabezado)))
