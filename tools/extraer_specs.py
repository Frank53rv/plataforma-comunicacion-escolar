# -*- coding: utf-8 -*-
"""Extrae el contenido normativo del documento de grado a artefactos legibles por máquina.

Dos niveles de fuente, conforme a D-21:

  · La **edición vigente** —el documento de 75 páginas— gobierna la totalidad de las
    tablas, con su numeración propia. Es la fuente absoluta.
  · La **v5.2** queda como anexo normativo de tres artefactos que la edición vigente
    condensó y ya no contiene: la narrativa de los quince casos de uso (punto 2.3), los
    sesenta y nueve casos de prueba individuales y el complemento de la semántica
    temporal —la franja que cruza la medianoche y la resolución del canal de entrega—.

Cada archivo generado declara en su encabezado de cuál de las dos proviene, de modo que
ninguna lectura del paquete pueda confundir un nivel con el otro.
"""
import os, re, json
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph

OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# La elección del archivo no se deja al orden alfabético: «TFG_ENTREGA_75paginas.docx»
# ordena antes que «TFG_entrega_5_Etapa4_v52.docx» porque las mayúsculas preceden a las
# minúsculas, de modo que tomar el último de la lista devolvería la edición vieja.
DOC_VIGENTE = os.environ.get('TFG_DOCX',
                             os.path.join(OUT, 'documento', 'TFG_ENTREGA_75paginas.docx'))
DOC_ANEXO = os.environ.get('TFG_DOCX_ANEXO',
                           os.path.join(OUT, 'documento', 'TFG_entrega_5_Etapa4_v52.docx'))


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
    # índice: 'Tabla NN' -> (título, filas, nota)
    tab = {}
    for i, (k, v) in enumerate(seq):
        if k != 'p': continue
        m = re.fullmatch(r'Tabla (\d+)', v)
        if not m: continue
        tit, j = '', i + 1
        while j < len(seq) and seq[j][0] == 'p':
            if seq[j][1]:
                tit = seq[j][1]; j += 1; break
            j += 1
        while j < len(seq) and seq[j][0] == 'p' and not seq[j][1]:
            j += 1
        if j < len(seq) and seq[j][0] == 't':
            nota = ''
            for q in range(j + 1, min(j + 4, len(seq))):
                if seq[q][0] == 'p' and seq[q][1].startswith('Nota.'):
                    nota = seq[q][1]; break
            tab[int(m.group(1))] = (tit, seq[j][1], nota)
    return tab, [v for k, v in seq if k == 'p' and v]


TAB, PARAS = leer_docx(DOC_VIGENTE)
TAB_A, PARAS_A = leer_docx(DOC_ANEXO)
BASE = os.path.basename(DOC_VIGENTE)
BASE_A = os.path.basename(DOC_ANEXO)
print('edición vigente:', BASE, '->', len(TAB), 'tablas,', len(PARAS), 'párrafos')
print('anexo v5.2     :', BASE_A, '->', len(TAB_A), 'tablas,', len(PARAS_A), 'párrafos')


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

HEAD_ANEXO = (f"<!-- GENERADO desde {BASE_A}, ANEXO NORMATIVO. NO EDITAR A MANO.\n"
              f"     La edición vigente ({BASE}) condensó este artefacto y ya no lo\n"
              "     contiene. Se conserva de la v5.2 por decisión D-21: es la única\n"
              "     fuente escrita de este contenido. Toda TABLA, en cambio, se lee de\n"
              "     la edición vigente y con su numeración. -->\n")


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
# Numeración de la edición vigente. La correspondencia con la v5.2 queda en D-21 y en
# specs/README.md: 17->10, 18->11, 19->12, 20->13, 21->14, 22->15, 26->17, 27->18,
# 34->23, 35->24, 36->25, 37->26, 38->27, 39->28, 40->29, 41->30, 42->31, 45->34, 46->35.
PLAN = [
    (10, 'specs/10-requisitos-funcionales.md'),
    (11, 'specs/11-requisitos-no-funcionales.md'),
    (12, 'specs/12-reglas-negocio.md'),
    (13, 'specs/13-casos-uso-resumen.md'),
    (14, 'specs/15-diccionario-datos.md'),
    (15, 'specs/16-trazabilidad.md'),
    (17, 'specs/31-tareas-criticas.md'),
    (18, 'specs/20-endpoints.md'),
    (23, 'specs/40-stack.md'),
    (24, 'specs/21-errores.md'),
    (25, 'specs/01-boundary-spec.md'),
    (26, 'specs/02-quality-spec.md'),
    (27, 'specs/22-esquema-fisico.md'),
    (28, 'specs/23-convenciones-api.md'),
    (29, 'specs/24-formas-peticion-respuesta.md'),
    (30, 'specs/41-variables-entorno.md'),
    (31, 'specs/42-ramificacion-versionado.md'),
    (34, 'specs/43-infraestructura.md'),
    (35, 'specs/44-despliegue.md'),
    # Registro del punto 5.5, propio de la edición vigente: no existía en la v5.2.
    (36, 'specs/45-plan-incrementos.md'),
    (37, 'specs/46-protocolo-medicion.md'),
    (38, 'specs/50-divergencias.md'),
    (39, 'specs/51-decisiones-del-documento.md'),
    (40, 'specs/52-herramientas-verificacion.md'),
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


# ---- ANEXO · narrativa de los quince casos de uso (punto 2.3 de la v5.2) ----
# Los pasos numerados del flujo principal son la especificación de la operación: sin este
# artefacto los requisitos que restan quedan sin enunciado paso a paso (CLAUDE.md §3.2).
cu = [p for p in PARAS_A if re.match(r'^CU-\d\d\. ', p)]
assert len(cu) == 15, f'se esperaban 15 casos de uso narrados en el anexo, hay {len(cu)}'
w('specs/14-casos-uso-narrativa.md',
  HEAD_ANEXO + "\n# Especificación narrativa de los quince casos de uso (punto 2.3)\n\n"
  "Cada caso declara actor, precondición, flujo principal numerado, flujos alternativos,\n"
  "flujos de excepción, postcondición y reglas aplicadas. **Los pasos del flujo principal\n"
  "son la especificación de la operación: no se agregan ni se omiten pasos.**\n\n"
  "> Procedencia. La edición vigente conserva únicamente el resumen de los casos de uso\n"
  "> (Tabla 13). Esta narrativa se toma de la v5.2, que es donde está escrita.\n\n"
  + '\n\n'.join('## ' + c.split('.')[0] + '\n\n' + c for c in cu))
written.append('specs/14-casos-uso-narrativa.md')

# ---- semántica temporal · edición vigente, completada con el anexo ----
temporal = bloque_desde(PARAS, 'Semántica temporal del motor de notificaciones',
                        'Formas de petición y respuesta')
temporal_a = bloque_desde(PARAS_A, 'Semántica temporal del motor de notificaciones',
                          'Formas de petición y respuesta')
canal_a = [p for p in PARAS_A
           if p.startswith('Una precisión sobre la creación de la fila de entrega')]
assert temporal, 'la edición vigente no trae la subsección de semántica temporal'
assert temporal_a, 'el anexo no trae la subsección de semántica temporal'
assert canal_a, 'el anexo no trae el párrafo de resolución del canal de entrega'

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

""" + '\n\n'.join(temporal) + f"""

## Complemento del anexo v5.2 · D-21

> La edición vigente condensó esta subsección y dejó fuera la franja que cruza la
> medianoche, el diferimiento y la resolución del canal de entrega. El texto que sigue es
> el de `{BASE_A}`, única fuente escrita de esas reglas. La compuerta `tiempo` las verifica.

""" + '\n\n'.join(temporal_a) + """

### Resolución del canal de entrega

""" + '\n\n'.join(canal_a) + "\n")
written.append('specs/25-semantica-temporal.md')

# ---- ANEXO · los sesenta y nueve casos de prueba (Tabla 43 de la v5.2) ----
# La edición vigente resume la matriz en cinco filas por grupo (Tabla 32) y no enuncia un
# solo CP-RF-nn individual. El punto 3.4 de CLAUDE.md exige el caso como enunciado de la
# prueba, y la compuerta `trazabilidad` lo contrasta requisito por requisito.
tit_v, rows_v, nota_v = TAB[32]
tit_a, rows_a, nota_a = TAB_A[43]
w('specs/30-casos-prueba.md',
  HEAD_ANEXO + f"\n# Matriz de casos de prueba\n\n"
  f"## Resumen por grupo · Tabla 32 de la edición vigente\n\n" + md_table(rows_v) + '\n'
  + (f'\n> {nota_v}\n' if nota_v else '')
  + f"\n## Los sesenta y nueve casos · Tabla 43 del anexo {BASE_A}\n\n"
  "> La edición vigente no enuncia los casos uno por uno. Se conservan de la v5.2 porque\n"
  "> son el enunciado con el que se escribe cada prueba (CLAUDE.md §3.4) y la fuente que\n"
  "> la compuerta `trazabilidad` contrasta.\n\n" + md_table(rows_a) + '\n'
  + (f'\n> {nota_a}\n' if nota_a else ''))
written.append('specs/30-casos-prueba.md')

print('markdown:', len(written), 'archivos')


def wj(path, obj):
    p = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')
    return path


# --- endpoints · Tabla 18 ---
# La edición vigente suprimió la columna «Operación» de la antigua Tabla 27: la tabla es
# ahora «Método y ruta | Roles autorizados | Caso de uso | Requisitos que realiza».
tit, rows, nota = TAB[18]
eps = []
for r in rows[1:]:
    if len(r) < 4 or not r[0] or r[0].startswith('Método'): continue
    m = re.match(r'^(GET|POST|PUT|PATCH|DELETE|WSS)\s+(\S+)$', r[0])
    if not m:
        print('  ! fila no parseada:', r[0]); continue
    roles = [x.strip() for x in re.split(r',| y ', r[1]) if x.strip()]
    # D-05 · la tabla marca «(Should)» por requisito y no por operación. Una operación es
    # Should have sólo si TODOS sus requisitos lo son; de lo contrario realiza al menos un
    # Must have y se construye. Las 43 operaciones menos las 5 puramente Should dan las 37
    # que el escenario de medición de CP-RNF-01 cuenta.
    marcados = re.findall(r'(RF-\d\d)(\s*\(Should\))?', r[3])
    eps.append({'metodo': m.group(1), 'ruta': m.group(2),
                'roles': roles, 'caso_uso': r[2],
                'requisitos': [c for c, _ in marcados],
                'requisitos_should': [c for c, s in marcados if s],
                'should': bool(marcados) and all(s for _, s in marcados)})
print('endpoints:', len(eps), '| Should:', sum(1 for e in eps if e['should']))
wj('specs/20-endpoints.json',
   {'fuente': f'Tabla 18 · {BASE}', 'total': len(eps), 'endpoints': eps})

# --- errores · Tabla 24, catálogo cerrado ---
tit, rows, _ = TAB[24]
errs = [{'estado': int(r[0]), 'cuando': r[1], 'flujos': r[2]}
        for r in rows[1:] if r[0].isdigit()]
print('errores:', len(errs), '->', sorted(e['estado'] for e in errs))
wj('specs/21-errores.json',
   {'fuente': f'Tabla 24 · catálogo cerrado · {BASE}', 'estados': errs})

# --- requisitos funcionales · Tabla 10 ---
tit, rows, _ = TAB[10]
rf = []
for r in rows[1:]:
    if not re.match(r'^RF-\d\d$', r[0].strip()): continue   # descarta las filas de módulo
    rf.append({'codigo': r[0].strip(), 'titulo': r[1], 'descripcion': r[2],
               'complejidad': r[3], 'moscow': r[4]})
print('RF:', len(rf), '| Must:', sum(1 for x in rf if x['moscow'] == 'M'),
      '| Should:', sum(1 for x in rf if x['moscow'] == 'S'))
wj('specs/10-requisitos-funcionales.json',
   {'fuente': f'Tabla 10 · {BASE}', 'total': len(rf), 'requisitos': rf})

# --- reglas de negocio · Tabla 12 ---
tit, rows, _ = TAB[12]
rn = [{'codigo': r[0].strip(), 'titulo': r[1], 'descripcion': r[2], 'prioridad': r[3]}
      for r in rows[1:] if re.match(r'^RN-\d\d$', r[0].strip())]
print('RN:', len(rn))
wj('specs/12-reglas-negocio.json',
   {'fuente': f'Tabla 12 · {BASE}', 'total': len(rn), 'reglas': rn})

# --- trazabilidad · Tabla 15 ---
# La edición vigente suprimió la columna «Requisito» de la antigua Tabla 22: queda
# «Cód. req. | Tipo | Prior. | RN asociada | Artefacto de diseño | Módulo | Caso de prueba».
tit, rows, _ = TAB[15]
tz = [{'requisito': r[0].strip(), 'tipo': r[1], 'prioridad': r[2], 'reglas': r[3],
       'diseno': r[4], 'modulo': r[5], 'caso_prueba': r[6]}
      for r in rows[1:] if re.match(r'^(RF|RNF)-\d\d$', r[0].strip())]
print('trazabilidad:', len(tz))
wj('specs/16-trazabilidad.json',
   {'fuente': f'Tabla 15 · {BASE}', 'total': len(tz), 'filas': tz})

# --- esquema físico · Tabla 27 ---
tit, rows, _ = TAB[27]
ent = []
for r in rows[1:]:
    if not r[0] or r[0] == 'Entidad': continue
    cols = []
    for tok in r[1].split('·'):
        tok = tok.strip()
        if not tok: continue
        cols.append(tok.split(' ')[0])
    ent.append({'entidad': r[0], 'columnas': cols, 'columnas_texto': r[1],
                'restricciones': r[2], 'reglas': r[3]})
print('entidades:', len(ent))
wj('specs/22-esquema-fisico.json',
   {'fuente': f'Tabla 27 · {BASE}', 'total': len(ent), 'entidades': ent})

# --- ANEXO · casos de prueba · Tabla 43 de la v5.2 ---
tit, rows, _ = TAB_A[43]
cp = [{'codigo': r[0].strip(), 'requisito': r[1].strip(), 'descripcion': r[2],
       'entrada': r[3], 'esperado': r[4]}
      for r in rows[1:] if re.match(r'^CP-', r[0].strip())]
print('CP (anexo):', len(cp))
wj('specs/30-casos-prueba.json',
   {'fuente': f'Tabla 43 · ANEXO {BASE_A} · D-21', 'total': len(cp), 'casos': cp})
