# Checklist: Rendimiento

- [ ] Toda lista expuesta por API esta paginada (sin devolver colecciones completas sin limite).
- [ ] Sin consultas N+1 (relaciones cargadas explicitamente, no en loop).
- [ ] Indices verificados para columnas usadas en WHERE, JOIN y ORDER BY en tablas grandes.
- [ ] Filtros aplicados lo antes posible en la consulta (WHERE antes de JOIN cuando es posible).
- [ ] Cache considerado (y justificado si no se usa) para consultas costosas y repetitivas.
