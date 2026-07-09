# Prompt: create-dashboard

## Se activa cuando el usuario escribe algo como

- "Arma un dashboard de {{tema}}"
- "Crea la pantalla de resumen de {{tema}}"
- "Necesito visualizar {{tema}} en el celular/escritorio"

## Que confirmar antes de generar (si no vino en el mensaje)

- Que reporte(s)/endpoint(s) alimentan el dashboard (ver `create-report.md` si aun no existe el endpoint).
- Plataforma: web, Electron (desktop) o app movil.
- Filtros interactivos requeridos (fecha, turno, equipo, frente).

## Proceso

1. Limitar el dashboard a maximo 5 visualizaciones (criterio de `.claude/skills/mining.md` / mining-operations-intelligence): KPI principal, tendencia, plan vs real, ranking, forecast. Mas de 5 diluye la lectura ejecutiva.
2. Usar `react-page.template.tsx` como base: cubrir siempre loading, empty, error y success states.
3. Aplicar `.claude/skills/frontend.md`: responsive, mobile-first, Dark Mode por tokens de tema, accesibilidad (aria-labels, foco visible).
4. Los datos se piden siempre a traves de la capa de cliente API tipada (nunca fetch directo en el componente).
5. Si el dashboard es para Power BI en vez de una app propia, usar `.claude/skills/powerbi.md` (modelo estrella + DAX) en lugar de este prompt de React.

## Checklist antes de entregar

- [ ] Maximo 5 visualizaciones, cada una con un proposito claro (no decorativas).
- [ ] Loading/empty/error states cubiertos.
- [ ] Responsive y usable en pantalla de celular.
- [ ] Ningun dato sensible de colaboradores/contratistas mostrado sin necesidad.
- [ ] KPIs con formula documentada (no solo el numero).
