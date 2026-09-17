# Colección de validación · Postman

Colección de validación ejecutable de la interfaz de programación (RNF-17 · CP-RNF-17).
Contiene las operaciones de la Tabla 18 que el enrutador expone hoy —26— agrupadas por
caso de uso, con los cuerpos y parámetros que cada una admite. Se amplía con cada módulo
que se construye, y su contenido coincide operación por operación con las rutas de
`bin/rails routes`.

| Archivo | Contenido |
|---|---|
| `postman_collection.json` | Las operaciones, por caso de uso |
| `postman_environment.json` | Variables del entorno local |

## Importar

En Postman: **Import** → seleccionar los dos archivos → elegir el entorno
*Plataforma de Comunicación Escolar · local* en el selector de entornos.

## Variables

| Variable | Uso |
|---|---|
| `base_url` | `http://localhost:3000/api/v1` con la composición levantada |
| `token` | Se completa sola al autenticarse con éxito |
| `directivo_correo` | El valor de `DIRECTIVO_CORREO` del archivo `.env` |
| `directivo_contrasena` | La credencial del directivo: la provisional de `.env` en el primer acceso, la propia después |
| `anio_lectivo_id`, `curso_id`, `docente_id`, `usuario_id`, `alumno_id`, `tutor_id`, `anuncio_id` | Identificadores que devuelven las operaciones de alta; se cargan a mano para las operaciones que los usan en la ruta o en el cuerpo |

## Recorrido

1. **CU-01 · Autenticar y emitir el token** con el directivo. La respuesta (201) trae
   `token`, `vence_en` y `usuario`, y el token queda guardado en `token`. El resto de las
   operaciones lo envía como `Authorization: Bearer {{token}}`.
2. Si `usuario.credencial_provisional` es `true`, **CU-02 · Sustituir la credencial
   provisional**: hasta hacerlo, toda otra operación responde 403 (RF-43).
3. **CU-03**: crear el año lectivo y un curso. **CU-04**: dar de alta un docente y
   vincularlo al curso. La respuesta del alta trae el código de activación en claro, una
   sola vez; con él, **CU-02 · Canjear el código** activa la cuenta del docente.
4. Autenticado como docente: **CU-05** alumnos y tutores, **CU-06** anuncios, **CU-09**
   historial, **CU-11** constancias y **CU-12** el canal grupal del curso, que integran sus
   docentes y los tutores de sus alumnos.

Para operar con otro rol se vuelve a autenticar con su correo y contraseña: el token nuevo
reemplaza al anterior.

## Errores

Toda respuesta de error es `application/problem+json` con uno de los nueve estados de la
Tabla 24 (401, 403, 404, 409, 410, 413, 415, 422, 500):

```json
{
  "type": "about:blank",
  "title": "No autenticado",
  "status": 401,
  "detail": "La sesión no es válida.",
  "instance": "/api/v1/sesiones",
  "codigo": "token_ausente"
}
```

El conflicto con una regla de negocio (409) agrega `regla`, con el código RN que se
incumple.

## Referencias

- `openapi/openapi.yaml` — contrato de la interfaz
- `specs/20-endpoints.md` — inventario de operaciones (Tabla 18)
- `specs/24-formas-peticion-respuesta.md` — formas de petición y respuesta (Tabla 29)
- `specs/21-errores.md` — catálogo de errores (Tabla 24)
