# -*- coding: utf-8 -*-
"""Extrae el contenido normativo del documento de grado a artefactos legibles por máquina.

Fuente única: la edición v6 (`Proyecto de grado entrega final.docx`), con su numeración
propia. No hay ningún otro documento normativo. El paquete resume la matriz de pruebas por
grupo (Tabla 34) y los casos de uso por su vista sinóptica (Tabla 13). Las tablas de los
anexos, rotuladas con letra y número (Tabla B1, Tabla F6), no se extraen.
"""
import os, re, json
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph

OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DOC_VIGENTE = os.environ.get('TFG_DOCX',
                             os.path.join(OUT, 'documento', 'Proyecto de grado entrega final.docx'))


def leer_docx(ruta):
    """Recorre el documento en orden y devuelve (índice de tablas, párrafos)."""
    if not os.path.exists(ruta):
        raise SystemExit(f'No se encuentra el documento: {ruta}')
    d = Document(ruta)
    seq = []  # ('p', texto) | ('t', [[celdas]])
    for ch in d.element.body.iterchildren():
        tag = ch.tag.split('}')[1]
        if tag == 'p':
            seq.append(('p', Paragraph(ch, d).text.strip()))
        elif tag == 'tbl':
            tb = Table(ch, d)
            filas = []
            for r in tb.rows:
                celdas, vistas = [], set()
                for c in r.cells:
                    if id(c._tc) in vistas: continue
                    vistas.add(id(c._tc))
                    celdas.append(re.sub(r'\s+', ' ', c.text).strip())
                filas.append(celdas)
            seq.append(('t', filas))
    # índice: 'Tabla NN' -> (título, filas, nota). El rótulo «Tabla NN: título» va al pie de
    # su tabla y la nota, si la hay, es el párrafo «Nota.» que sigue al rótulo. El índice de
    # tablas repite los rótulos, pero no sigue a ninguna tabla: por eso no se confunde.
    tab = {}
    for i, (k, v) in enumerate(seq):
        if k != 'p': continue
        m = re.fullmatch(r'Tabla (\d+): (.+)', v)
        if not m: continue
        j = i - 1
        while j >= 0 and seq[j][0] == 'p' and not seq[j][1]:
            j -= 1
        if j < 0 or seq[j][0] != 't': continue
        q = i + 1
        while q < len(seq) and seq[q][0] == 'p' and not seq[q][1]:
            q += 1
        nota = seq[q][1] if q < len(seq) and seq[q][0] == 'p' and seq[q][1].startswith('Nota.') else ''
        tab[int(m.group(1))] = (m.group(2).strip(), seq[j][1], nota)
    return tab, [v for k, v in seq if k == 'p' and v]


TAB, PARAS = leer_docx(DOC_VIGENTE)
BASE = os.path.basename(DOC_VIGENTE)
print('edición v6:', BASE, '->', len(TAB), 'tablas,', len(PARAS), 'párrafos')


def por_encabezado(num, *requeridas):
    """Devuelve las filas de una tabla como diccionarios indexados por el encabezado.

    Las columnas se leen por su nombre y no por su posición: una columna que el documento
    agregue no corre las demás, y una que falte detiene la extracción. Las filas que no
    tienen tantas celdas como el encabezado —las de módulo, combinadas— quedan afuera.
    """
    encabezado = TAB[num][1][0]
    faltan = [c for c in requeridas if c not in encabezado]
    if faltan:
        raise SystemExit(f'Tabla {num}: faltan las columnas {faltan}; tiene {encabezado}.')
    return [dict(zip(encabezado, f)) for f in TAB[num][1][1:] if len(f) == len(encabezado)]


def md_table(rows):
    if not rows: return ''
    n = max(len(r) for r in rows)
    rows = [r + [''] * (n - len(r)) for r in rows]
    esc = lambda s: s.replace('|', '\\|')
    out = ['| ' + ' | '.join(esc(c) for c in rows[0]) + ' |',
           '|' + '|'.join(['---'] * n) + '|']
    for r in rows[1:]:
        out.append('| ' + ' | '.join(esc(c) for c in r) + ' |')
    return '\n'.join(out)


def w(path, text):
    p = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(text.rstrip() + '\n')
    return path


HEAD = (f"<!-- GENERADO desde {BASE}, edición vigente. NO EDITAR A MANO.\n"
        "     La fuente de verdad es el documento de grado. Si este archivo y el\n"
        "     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->\n")

def dump_tabla(num, fname, extra=''):
    if num not in TAB:
        raise SystemExit(f'La edición vigente no tiene Tabla {num} (destino {fname}).')
    tit, rows, nota = TAB[num]
    body = f"{HEAD}\n# Tabla {num} · {tit}\n\n"
    if extra: body += extra.strip() + '\n\n'
    body += md_table(rows) + '\n'
    if nota: body += '\n> ' + nota + '\n'
    return w(fname, body)


written = []
# Numeración de la edición v6: del 1 al 22 coincide con la edición de 39 tablas; desde la
# 23 suben dos números, porque la Etapa 2 ganó dos tablas (también en specs/README.md).
PLAN = [
    (10, 'specs/10-requisitos-funcionales.md'),
    (11, 'specs/11-requisitos-no-funcionales.md'),
    (12, 'specs/12-reglas-negocio.md'),
    (13, 'specs/13-casos-uso-resumen.md'),
    (14, 'specs/15-diccionario-datos.md'),
    (15, 'specs/16-trazabilidad.md'),
    (17, 'specs/31-tareas-criticas.md'),
    (18, 'specs/20-endpoints.md'),
    (25, 'specs/40-stack.md'),
    (26, 'specs/21-errores.md'),
    (27, 'specs/01-boundary-spec.md'),
    (28, 'specs/02-quality-spec.md'),
    (29, 'specs/22-esquema-fisico.md'),
    (30, 'specs/23-convenciones-api.md'),
    (31, 'specs/24-formas-peticion-respuesta.md'),
    (32, 'specs/41-variables-entorno.md'),
    (33, 'specs/42-ramificacion-versionado.md'),
    (36, 'specs/43-infraestructura.md'),
    (37, 'specs/44-despliegue.md'),
    (38, 'specs/45-plan-incrementos.md'),
    (39, 'specs/46-protocolo-medicion.md'),
    (40, 'specs/51-decisiones-del-documento.md'),
    (41, 'specs/52-herramientas-verificacion.md'),
]
for num, fn in PLAN:
    written.append(dump_tabla(num, fn))

# ---- Context Spec (prosa del punto 4.2 de la edición vigente) ----
ctx = next(p for p in PARAS if p.startswith('Context Spec.'))
w('specs/00-context-spec.md',
  HEAD + "\n# Context Spec (punto 4.2 del documento de grado)\n\n" + ctx + "\n")
written.append('specs/00-context-spec.md')


def bloque_desde(paras, titulo, hasta):
    """Devuelve los párrafos entre un encabezado y el siguiente, sin incluirlos."""
    try: i = paras.index(titulo)
    except ValueError: return []
    out = []
    for p in paras[i + 1:]:
        if p == hasta: break
        out.append(p)
    return out


# ---- semántica temporal · edición vigente, completada con el anexo ----
temporal = bloque_desde(PARAS, 'Semántica temporal del motor de notificaciones',
                        'Formas de petición y respuesta')
assert temporal, 'la edición vigente no trae la subsección de semántica temporal'

w('specs/25-semantica-temporal.md',
  HEAD + """
# Semántica temporal y resolución del canal de entrega (punto 4.2)

Estas reglas **no están en ninguna tabla**: son prosa normativa del punto 4.2. Se extraen
acá porque el motor de notificaciones no es implementable sin ellas y porque son
exactamente el tipo de decisión que una asistencia inventaría si no las encontrara escritas.

## Regla de aplicación

- Toda marca de tiempo se **almacena** en tiempo universal coordinado.
- Toda hora de pared —`preferencia.hora_inicio`, `preferencia.hora_fin` y la hora de
  publicación programada— se **interpreta** en la zona declarada abajo.
- No se declara una zona por usuario. No se introduce ninguna otra zona en el código,
  ni configurable ni por omisión.
- El cálculo de la franja de disponibilidad es el que se enuncia abajo, **incluido el caso
  en que la franja cruza la medianoche**. Una comparación ingenua de extremos es incorrecta.

## Texto de la edición vigente

""" + '\n\n'.join(temporal) + "\n")
written.append('specs/25-semantica-temporal.md')

# ---- los casos de prueba, resumidos por grupo (Tabla 34) ----
# El documento no enuncia un CP-RF-nn por requisito: resume la matriz por grupo, con el
# criterio de aprobación de la Tabla 34 y el umbral sobre el alcance comprometido. El
# enunciado de cada prueba se arma con el requisito (Tabla 10) y la postcondición del caso
# de uso que lo realiza (Tabla 13).
tit_v, rows_v, nota_v = TAB[34]
w('specs/30-casos-prueba.md',
  HEAD + f"\n# Matriz de casos de prueba\n\n"
  f"## Resumen por grupo · Tabla 34\n\n" + md_table(rows_v) + '\n'
  + (f'\n> {nota_v}\n' if nota_v else ''))
written.append('specs/30-casos-prueba.md')

print('markdown:', len(written), 'archivos')


def wj(path, obj):
    p = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')
    return path


# --- endpoints · Tabla 18 ---
eps = []
for f in por_encabezado(18, 'Método y ruta', 'Roles autorizados', 'Caso de uso', 'Requisitos que realiza'):
    m = re.match(r'^(GET|POST|PUT|PATCH|DELETE|WSS)\s+(\S+)$', f['Método y ruta'])
    if not m:
        print('  ! fila no parseada:', f['Método y ruta']); continue
    roles = [x.strip() for x in re.split(r',| y ', f['Roles autorizados']) if x.strip()]
    # La tabla marca «(Should)» por requisito y no por operación. Una operación es
    # Should have sólo si TODOS sus requisitos lo son; de lo contrario realiza al menos un
    # Must have y se construye. Las 41 operaciones sobre HTTP menos las 5 puramente Should
    # dan las 36 del enrutador; el canal de tiempo real es la cuadragésima segunda.
    marcados = re.findall(r'(RF-\d\d)(\s*\(Should\))?', f['Requisitos que realiza'])
    eps.append({'metodo': m.group(1), 'ruta': m.group(2),
                'roles': roles, 'caso_uso': f['Caso de uso'],
                'requisitos': [c for c, _ in marcados],
                'requisitos_should': [c for c, s in marcados if s],
                'should': bool(marcados) and all(s for _, s in marcados)})
print('endpoints:', len(eps), '| Should:', sum(1 for e in eps if e['should']))
wj('specs/20-endpoints.json',
   {'fuente': f'Tabla 18 · {BASE}', 'total': len(eps), 'endpoints': eps})

# --- errores · Tabla 26, catálogo cerrado ---
errs = [{'estado': int(f['Estado']), 'cuando': f['Cuándo se emite'], 'flujos': f['Flujos que lo originan']}
        for f in por_encabezado(26, 'Estado', 'Cuándo se emite', 'Flujos que lo originan')
        if f['Estado'].isdigit()]
print('errores:', len(errs), '->', sorted(e['estado'] for e in errs))
wj('specs/21-errores.json',
   {'fuente': f'Tabla 26 · catálogo cerrado · {BASE}', 'estados': errs})

# --- requisitos funcionales · Tabla 10 ---
rf = [{'codigo': f['Código'].strip(), 'titulo': f['Requisito funcional'], 'descripcion': f['Descripción'],
       'complejidad': f['Compl.'], 'moscow': f['Prior.']}
      for f in por_encabezado(10, 'Código', 'Requisito funcional', 'Descripción', 'Compl.', 'Prior.')
      if re.match(r'^RF-\d\d$', f['Código'].strip())]   # descarta las filas de módulo
print('RF:', len(rf), '| Must:', sum(1 for x in rf if x['moscow'] == 'M'),
      '| Should:', sum(1 for x in rf if x['moscow'] == 'S'))
wj('specs/10-requisitos-funcionales.json',
   {'fuente': f'Tabla 10 · {BASE}', 'total': len(rf), 'requisitos': rf})

# --- reglas de negocio · Tabla 12 ---
rn = [{'codigo': f['Código'].strip(), 'titulo': f['Regla de negocio'], 'descripcion': f['Descripción'],
       'prioridad': f['Prioridad']}
      for f in por_encabezado(12, 'Código', 'Regla de negocio', 'Descripción', 'Prioridad')
      if re.match(r'^RN-\d\d$', f['Código'].strip())]
print('RN:', len(rn))
wj('specs/12-reglas-negocio.json',
   {'fuente': f'Tabla 12 · {BASE}', 'total': len(rn), 'reglas': rn})

# --- trazabilidad · Tabla 15 ---
tz = [{'requisito': f['Cód. req.'].strip(), 'titulo': f['Título'], 'tipo': f['Tipo'], 'prioridad': f['Prior.'],
       'reglas': f['RN asociada'], 'diseno': f['Artefacto de diseño'],
       'modulo': f['Módulo / componente'], 'caso_prueba': f['Caso de prueba']}
      for f in por_encabezado(15, 'Cód. req.', 'Título', 'Tipo', 'Prior.', 'RN asociada',
                              'Artefacto de diseño', 'Módulo / componente', 'Caso de prueba')
      if re.match(r'^(RF|RNF)-\d\d$', f['Cód. req.'].strip())]
print('trazabilidad:', len(tz))
wj('specs/16-trazabilidad.json',
   {'fuente': f'Tabla 15 · {BASE}', 'total': len(tz), 'filas': tz})

# --- esquema físico · Tabla 29 ---
ent = []
for f in por_encabezado(29, 'Entidad', 'Columnas y tipos', 'Claves, índices y restricciones', 'Regla que realiza'):
    if not f['Entidad']: continue
    cols = []
    for tok in f['Columnas y tipos'].split('·'):
        tok = tok.strip()
        if not tok: continue
        cols.append(tok.split(' ')[0])
    ent.append({'entidad': f['Entidad'], 'columnas': cols, 'columnas_texto': f['Columnas y tipos'],
                'restricciones': f['Claves, índices y restricciones'], 'reglas': f['Regla que realiza']})
print('entidades:', len(ent))
wj('specs/22-esquema-fisico.json',
   {'fuente': f'Tabla 29 · {BASE}', 'total': len(ent), 'entidades': ent})
