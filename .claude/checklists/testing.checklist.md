# Checklist: Pruebas

- [ ] Tests unitarios de la logica de negocio (Service) con dependencias mockeadas.
- [ ] Tests de integracion del Controller contra base de datos de prueba.
- [ ] Cobertura de logica de negocio mayor a 90%.
- [ ] Casos cubiertos: camino feliz, errores de validacion, autorizacion fallida, casos borde (vacios, nulos, limites).
- [ ] Ningun test marcado como skip/pending queda en el codigo final.
- [ ] Los tests corren con un solo comando y pasan en verde antes de entregar.
