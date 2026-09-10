# Plataforma de comunicación escolar con notificaciones inteligentes

API REST de un colegio. Proyecto de Grado — UNAE.
Repositorio construido **a partir del documento de grado**, no al revés.

## Qué hay acá antes de que haya código

| Carpeta | Qué es |
|---|---|
| `documento/` | El `.docx` versión 5.2. Fuente de verdad única. |
| `specs/` | Su contenido normativo, extraído a Markdown y JSON. No se edita a mano. |
| `CLAUDE.md` | Contrato que la asistencia de IA lee al abrir el repositorio. |
| `tools/` | El extractor y las siete compuertas de verificación. |
| `bin/verificar` | Corre las siete compuertas. Ninguna rama se integra en rojo. |

## Puesta en marcha

```bash
pip install python-docx            # sólo para regenerar specs/
python3 tools/extraer_specs.py     # regenera specs/ desde documento/*.docx
./bin/verificar                    # estado actual del repositorio
```

Cuando el documento cambie: se reemplaza el `.docx` en `documento/`, se corre el extractor
y se revisa el `git diff` de `specs/`. Ese diff **es** el cambio de alcance, y se registra
en el histórico de revisiones del documento.

## Antes de cada integración de rama

```bash
bin/rails routes > tmp/rutas.txt
bundle exec rspec                  # genera coverage/.last_run.json
./bin/verificar
```

Para que no dependa de la memoria, instalá el gancho:

```bash
git config core.hooksPath hooks
```

## Las siete compuertas

| Compuerta | Compara | Verifica |
|---|---|---|
| contrato | enrutador ↔ 43 operaciones de la Tabla 27 | RNF-17 · CP-RNF-17 |
| errores | estados emitidos ↔ catálogo cerrado de 9, Tabla 35 | Boundary 6 |
| esquema | `db/schema.rb` ↔ 19 entidades de la Tabla 38 | Boundary 3 |
| alcance | ningún Should have construido sin decisión adoptada | Boundary 1 |
| trazabilidad | cada Must have con código, prueba `CP-RF-nn` y rama | RNF-22 · CP-RNF-22 |
| cobertura | líneas de la API ≥ 70 % | RNF-20 · CP-RNF-20 |
| tiempo | zona horaria, lectura de hora y franja de disponibilidad ↔ punto 4.2 | RF-33 · RN-24 · RN-32 |

No hay integración continua: el punto 4.5 del documento lo declara de forma expresa. Estas
compuertas son la condición de integración que la reemplaza, conforme al Quality Spec.
