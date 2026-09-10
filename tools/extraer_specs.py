# -*- coding: utf-8 -*-
"""Extrae el contenido normativo del .docx a artefactos legibles por máquina."""
import os, re, json
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph
from docx.oxml.ns import qn

SRC = os.environ.get('TFG_DOCX', '')
if not SRC:
    import glob
    cand = sorted(glob.glob('documento/*.docx'))
    if not cand:
        raise SystemExit('No hay ningún .docx en documento/. Definí TFG_DOCX.')
    SRC = cand[-1]
BASE = os.path.basename(SRC)
m_ver = re.search(r'v(\d)[._-]?(\d)', BASE)
VER = f'{m_ver.group(1)}.{m_ver.group(2)}' if m_ver else 'sin versión'
OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = Document(SRC)

# ---- recorrido lineal: párrafos y tablas en orden ----
seq = []  # ('p', texto) | ('t', [[celdas]])
for ch in d.element.body.iterchildren():
    tag = ch.tag.split('}')[1]
    if tag == 'p':
        seq.append(('p', Paragraph(ch, d).text.strip()))
    elif tag == 'tbl':
        tb = Table(ch, d)
        rows = []
        for r in tb.rows:
            cells, seen = [], set()
            for c in r.cells:
                if id(c._tc) in seen: continue
                seen.add(id(c._tc))
                cells.append(re.sub(r'\s+', ' ', c.text).strip())
            rows.append(cells)
        seq.append(('t', rows))

# ---- índice: 'Tabla NN' -> (título, filas, nota) ----
TAB = {}
for i, (k, v) in enumerate(seq):
    if k != 'p': continue
    m = re.fullmatch(r'Tabla (\d+)', v)
    if not m: continue
    tit = ''
    j = i + 1
    while j < len(seq) and seq[j][0] == 'p':
        if seq[j][1]: tit = seq[j][1]; j += 1; break
        j += 1
    while j < len(seq) and seq[j][0] == 'p' and not seq[j][1]:
        j += 1
    if j < len(seq) and seq[j][0] == 't':
        nota = ''
        for q in range(j + 1, min(j + 4, len(seq))):
            if seq[q][0] == 'p' and seq[q][1].startswith('Nota.'):
                nota = seq[q][1]; break
        TAB[int(m.group(1))] = (tit, seq[j][1], nota)
print('tablas indexadas:', len(TAB), '->', sorted(TAB)[:5], '...', sorted(TAB)[-3:])

PARAS = [v for k, v in seq if k == 'p' and v]

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

HEAD = (f"<!-- GENERADO desde {BASE}. NO EDITAR A MANO.\n"
        "     La fuente de verdad es el documento de grado. Si este archivo y el\n"
        "     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->\n")

def dump_tabla(num, fname, extra=''):
    tit, rows, nota = TAB[num]
    body = f"{HEAD}\n# Tabla {num} · {tit}\n\n"
    if extra: body += extra.strip() + '\n\n'
    body += md_table(rows) + '\n'
    if nota: body += '\n> ' + nota + '\n'
    return w(fname, body)

written = []
PLAN = [
    (17, 'specs/10-requisitos-funcionales.md'),
    (18, 'specs/11-requisitos-no-funcionales.md'),
    (19, 'specs/12-reglas-negocio.md'),
    (20, 'specs/13-casos-uso-resumen.md'),
    (21, 'specs/15-diccionario-datos.md'),
    (22, 'specs/16-trazabilidad.md'),
    (26, 'specs/31-tareas-criticas.md'),
    (27, 'specs/20-endpoints.md'),
    (34, 'specs/40-stack.md'),
    (35, 'specs/21-errores.md'),
    (36, 'specs/01-boundary-spec.md'),
    (37, 'specs/02-quality-spec.md'),
    (38, 'specs/22-esquema-fisico.md'),
    (39, 'specs/23-convenciones-api.md'),
    (40, 'specs/24-formas-peticion-respuesta.md'),
    (41, 'specs/41-variables-entorno.md'),
    (42, 'specs/42-ramificacion-versionado.md'),
    (43, 'specs/30-casos-prueba.md'),
    (45, 'specs/43-infraestructura.md'),
    (46, 'specs/44-despliegue.md'),
]
for num, fn in PLAN:
    written.append(dump_tabla(num, fn))

# ---- narrativa de los 15 casos de uso ----
cu = [p for p in PARAS if re.match(r'^CU-\d\d\. ', p)]
assert len(cu) == 15, len(cu)
w('specs/14-casos-uso-narrativa.md',
  HEAD + "\n# Especificación narrativa de los quince casos de uso (punto 2.3)\n\n"
  "Cada caso declara actor, precondición, flujo principal numerado, flujos alternativos,\n"
  "flujos de excepción, postcondición y reglas aplicadas. **Los pasos del flujo principal\n"
  "son la especificación de la operación: no se agregan ni se omiten pasos.**\n\n"
  + '\n\n'.join('## ' + c.split('.')[0] + '\n\n' + c for c in cu))
written.append('specs/14-casos-uso-narrativa.md')

# ---- Context Spec (prosa del punto 4.2) ----
ctx = next(p for p in PARAS if p.startswith('Context Spec.'))
intro = next(p for p in PARAS if p.startswith('La Tabla 1 declara el uso de asistencia'))
w('specs/00-context-spec.md',
  HEAD + "\n# Context Spec (punto 4.2 del documento de grado)\n\n" + intro + "\n\n" + ctx + "\n")
written.append('specs/00-context-spec.md')


# ---- semántica temporal y resolución del canal (prosa normativa del punto 4.2) ----
def bloque_desde(titulo, hasta):
    """Devuelve los párrafos entre un encabezado y el siguiente, sin incluirlos."""
    try: i = PARAS.index(titulo)
    except ValueError: return []
    out = []
    for p in PARAS[i+1:]:
        if p == hasta: break
        out.append(p)
    return out

temporal = bloque_desde('Semántica temporal del motor de notificaciones',
                        'Formas de petición y respuesta')
canal = [p for p in PARAS if p.startswith('Una precisión sobre la creación de la fila de entrega')]
assert temporal, 'no se encontró la subsección de semántica temporal'
assert canal, 'no se encontró el párrafo de resolución del canal de entrega'

w('specs/25-semantica-temporal.md',
  HEAD + """
# Semántica temporal y resolución del canal de entrega (punto 4.2)

Estas reglas **no están en ninguna tabla**: son prosa normativa del punto 4.2 del documento.
Se extraen acá porque el motor de notificaciones no es implementable sin ellas y porque son
exactamente el tipo de decisión que una asistencia inventaría si no las encontrara escritas.

## Regla de aplicación

- Toda marca de tiempo se **almacena** en tiempo universal coordinado.
- Toda hora de pared —`preferencia.hora_inicio`, `preferencia.hora_fin` y la hora de
  publicación programada— se **interpreta** en la zona declarada abajo.
- No se declara una zona por usuario. No se introduce ninguna otra zona en el código,
  ni configurable ni por omisión.
- El cálculo de la franja de disponibilidad es el que se enuncia abajo, **incluido el caso
  en que la franja cruza la medianoche**. Una comparación ingenua de extremos es incorrecta.

## Texto del documento

""" + '\n\n'.join(temporal) + """

## Resolución del canal de entrega

""" + '\n\n'.join(canal) + "\n")
written.append('specs/25-semantica-temporal.md')

OUTD = OUT
print('markdown:', len(written), 'archivos')
def wj(path, obj):
    p = os.path.join(OUTD, path); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p,'w',encoding='utf-8').write(json.dumps(obj, ensure_ascii=False, indent=2)+'\n')
    return path

# --- endpoints (Tabla 27) ---
tit, rows, nota = TAB[27]
eps=[]
for r in rows[1:]:
    if len(r)<5 or not r[0] or r[0].startswith('Método'): continue
    mr = r[0]
    m = re.match(r'^(GET|POST|PUT|PATCH|DELETE|WSS)\s+(\S+)$', mr)
    if not m:
        print('  ! fila no parseada:', r[0]); continue
    roles = [x.strip() for x in re.split(r',| y ', r[2]) if x.strip()]
    # D-05 · la Tabla 27 marca «(Should)» por requisito y no por operación:
    # «RF-17, RF-18 (Should), RF-21, RF-31». Una operación es Should have sólo si
    # TODOS sus requisitos lo son; de lo contrario realiza al menos un Must have y
    # se construye. CP-RNF-01 lo confirma: 42 operaciones HTTP menos las 5
    # puramente Should dan las 37 que la Tabla 43 cuenta.
    marcados = re.findall(r'(RF-\d\d)(\s*\(Should\))?', r[4])
    eps.append({'metodo':m.group(1),'ruta':m.group(2),'operacion':r[1],
                'roles':roles,'caso_uso':r[3],
                'requisitos':[c for c, _ in marcados],
                'requisitos_should':[c for c, s in marcados if s],
                'should': bool(marcados) and all(s for _, s in marcados)})
print('endpoints:', len(eps))
wj('specs/20-endpoints.json', {'fuente': f'Tabla 27 · TFG v{VER}','total':len(eps),'endpoints':eps})

# --- errores (Tabla 35) ---
tit, rows, _ = TAB[35]
errs=[{'estado':int(r[0]),'cuando':r[1],'flujos':r[2]} for r in rows[1:] if r[0].isdigit()]
print('errores:', len(errs))
wj('specs/21-errores.json', {'fuente':'Tabla 35 · catálogo cerrado','estados':errs})

# --- requisitos funcionales (Tabla 17) ---
tit, rows, _ = TAB[17]
rf=[]
for r in rows[1:]:
    if not re.match(r'^RF-\d\d$', r[0].strip()): continue
    rf.append({'codigo':r[0].strip(),'titulo':r[1],'descripcion':r[2],
               'complejidad':r[3],'moscow':r[4]})
print('RF:', len(rf), '| Must:', sum(1 for x in rf if x['moscow']=='M'), '| Should:', sum(1 for x in rf if x['moscow']=='S'))
wj('specs/10-requisitos-funcionales.json', {'fuente':'Tabla 17','total':len(rf),'requisitos':rf})

# --- reglas de negocio (Tabla 19) ---
tit, rows, _ = TAB[19]
rn=[{'codigo':r[0].strip(),'titulo':r[1],'descripcion':r[2],'prioridad':r[3]}
    for r in rows[1:] if re.match(r'^RN-\d\d$', r[0].strip())]
print('RN:', len(rn))
wj('specs/12-reglas-negocio.json', {'fuente':'Tabla 19','total':len(rn),'reglas':rn})

# --- casos de prueba (Tabla 43) ---
tit, rows, _ = TAB[43]
cp=[{'codigo':r[0].strip(),'requisito':r[1].strip(),'descripcion':r[2],
     'entrada':r[3],'esperado':r[4]} for r in rows[1:] if re.match(r'^CP-', r[0].strip())]
print('CP:', len(cp))
wj('specs/30-casos-prueba.json', {'fuente':'Tabla 43','total':len(cp),'casos':cp})

# --- trazabilidad (Tabla 22) ---
tit, rows, _ = TAB[22]
tz=[{'requisito':r[0].strip(),'titulo':r[1],'tipo':r[2],'prioridad':r[3],
     'reglas':r[4],'diseno':r[5],'modulo':r[6],'caso_prueba':r[7]}
    for r in rows[1:] if re.match(r'^(RF|RNF)-\d\d$', r[0].strip())]
print('trazabilidad:', len(tz))
wj('specs/16-trazabilidad.json', {'fuente':'Tabla 22','total':len(tz),'filas':tz})

# --- esquema físico (Tabla 38) ---
tit, rows, _ = TAB[38]
ent=[]
for r in rows[1:]:
    if not r[0] or r[0]=='Entidad': continue
    cols=[]
    for tok in r[1].split('·'):
        tok=tok.strip()
        if not tok: continue
        cols.append(tok.split(' ')[0])
    ent.append({'entidad':r[0],'columnas':cols,'columnas_texto':r[1],
                'restricciones':r[2],'reglas':r[3]})
print('entidades:', len(ent))
wj('specs/22-esquema-fisico.json', {'fuente':'Tabla 38','total':len(ent),'entidades':ent})

