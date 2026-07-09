# Checklist: Diseno (Fase 10 — gate previo a generar codigo)

Se revisa ANTES de correr `generate-module.js` (Fase 8), no despues. Si algo
aqui falla, el problema se resuelve en el design doc, no parcheando el codigo
generado.

- [ ] Entidad y campos de negocio confirmados (mas alla de las columnas de auditoria obligatorias).
- [ ] Reglas de negocio especiales identificadas (transiciones de estado, validaciones cruzadas entre campos, calculos derivados).
- [ ] Roles/permisos que acceden a cada operacion (crear, leer, actualizar, eliminar) definidos explicitamente, no asumidos.
- [ ] Requisitos no funcionales explicitos: paginacion esperada, volumen de datos aproximado, si aplica un SLA de respuesta.
- [ ] Fuente de datos marcada como confirmada (endpoint/tabla real) o explicitamente "Pendiente de confirmar" — nunca un nombre de campo o endpoint inventado.
- [ ] Clasificacion de datos y compliance: si el modulo toca produccion, CFEM, reservas, ESG o datos personales, queda marcado que requiere validacion humana antes de uso externo/regulatorio.
- [ ] Patron de arquitectura confirmado (Clean Architecture + Repository Pattern segun `.claude/templates/README.md`) o excepcion documentada con motivo.
- [ ] Fuera de alcance explicito: que NO se va a construir en esta iteracion.

`scripts/check-design.js <modulo>` automatiza la verificacion de que estas secciones existen y no quedaron como placeholder sin llenar. No reemplaza el criterio humano sobre si las respuestas son correctas, solo confirma que existen.
