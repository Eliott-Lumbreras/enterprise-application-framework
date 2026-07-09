# Workflow: release

## Cuando se usa

Una version del proyecto esta lista para pasar de desarrollo/homologacion a produccion.

## Pasos

1. Confirmar que todos los tests (unitarios + integracion) estan en verde y la cobertura de logica de negocio supera 90% (`.claude/skills/testing.md`).
2. Ejecutar el pipeline definido en `.claude/skills/deployment.md`: install -> lint -> test -> build -> scan -> deploy.
3. Desplegar primero a un ambiente de desarrollo/homologacion. Nunca saltar directo a produccion, en especial si el proyecto integra con SAP, PI System o bases de datos criticas.
4. Verificar health/readiness checks respondiendo correctamente en el ambiente de homologacion antes de promover a produccion.
5. Documentar el plan de rollback especifico de esta version (comando o pipeline exacto) antes de desplegar a produccion.
6. Etiquetar la version en git (tag semantico) y actualizar el CHANGELOG/README con lo incluido en la release.

## Salida esperada

Una version desplegada en produccion con: pipeline verde, checks de salud confirmados en homologacion primero, y un rollback documentado y probado (o al menos definido) antes del despliegue final.

## Checklist de cierre

- [ ] Tests en verde y cobertura de negocio >90%.
- [ ] Paso por homologacion confirmado antes de produccion.
- [ ] Health/readiness verificados en homologacion.
- [ ] Plan de rollback documentado para esta version especifica.
- [ ] Version etiquetada en git y CHANGELOG/README actualizado.
