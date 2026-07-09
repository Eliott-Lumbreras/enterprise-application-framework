# Design doc: {{PascalCase}}

Completar ANTES de correr `generate-module.js {{kebab-case}}` (Fase 8).
Ninguna seccion se deja con el placeholder de abajo: se reemplaza por una
respuesta real o, si de verdad no se sabe todavia, por "Pendiente de
confirmar" explicito (nunca un valor inventado que "suene" razonable).

## Entidad y campos

_(completar antes de generar código)_

Lista de campos de negocio (fuera de las columnas de auditoria obligatorias:
id, created_at, updated_at, created_by, updated_by, deleted_at), con tipo y
si son requeridos u opcionales.

## Reglas de negocio

_(completar antes de generar código)_

Transiciones de estado, validaciones cruzadas entre campos, calculos
derivados. Si es un CRUD simple sin reglas especiales, decirlo explicitamente
en vez de dejar la seccion vacia.

## Roles y permisos

_(completar antes de generar código)_

Quien puede crear/leer/actualizar/eliminar. Si un rol no deberia poder hacer
una operacion, decirlo explicitamente (no asumir "todos pueden todo").

## Requisitos no funcionales

_(completar antes de generar código)_

Paginacion esperada, volumen de datos aproximado, SLA de respuesta si aplica.

## Fuente de datos

_(completar antes de generar código)_

Endpoint/tabla real confirmado, o "Pendiente de confirmar" explicito si
todavia no se tiene acceso a la fuente real. Nunca inventar un nombre de
endpoint o de columna.

## Clasificación de datos y compliance

_(completar antes de generar código)_

Indicar si el modulo toca produccion, CFEM, reservas minerales, ESG o datos
personales de colaboradores/terceros. Si aplica, marcar explicitamente que
requiere validacion humana antes de uso externo/regulatorio (compliance).
Si no aplica, decir "No aplica" explicitamente.

## Fuera de alcance

_(completar antes de generar código)_

Que NO se va a construir en esta iteracion, para no estirar el modulo mas
alla de lo pedido.
