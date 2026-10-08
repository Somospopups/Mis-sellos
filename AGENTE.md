# AGENTE.md — reglas del repo Mis Sellos

Producto SaaS de **POPUPS**: tarjeta de fidelidad digital para comercios de
barrio. Si este archivo contradice a otro, prevalece este.

## Prioridad (la regla de oro)

1. **Que funcione estupendamente bien** — rápido, confiable, sin fricción.
2. **Que se entienda de un vistazo** — jerarquía clara, lenguaje humano.
3. **Que se vea estupendamente bien** — amplifica lo anterior, nunca lo tapa.

## Versionado (obligatorio)

- Fuente de verdad: constante `VERSION` en `lib/version.ts` (entero, sube de 1
  en 1, sin decimales). Cada cambio publicado consume un número.
- Si hay que romper cache de CSS/JS, usar el mismo número en el query string
  `?v=` correspondiente.
- **Toda tarea se cierra con una línea exacta:** `v<N> funcionando!`

## Chequeos antes de dar por terminada una tarea

```bash
npm run lint
npx tsc --noEmit
npm run build
```

- Si se tocó UI: verificar mobile (375px), modo oscuro y `prefers-reduced-motion`.
- Si se tocó el sello/flujo crítico: smoke test manual end-to-end (alta →
  sello → canje → doble sello rechazado).

## Identidad visual

- Paleta POPUPS (extraída de somospopups.netlify.app): tinta `#050505`,
  lima `#c8f810` / `#aee800`, papel `#f3f3ee`, gris `#aaaDA4`, líneas
  `rgba(255,255,255,.16)` / `rgba(5,5,5,.14)`, radio `28px`, ancho máx `1200px`.
- Está pendiente de confirmación en `popups/referencias/identidad-visual.md`:
  **no inventar colores ni tipografías nuevas** hasta que Germán lo confirme.
- El movimiento **guía, no distrae**: siempre respetar `prefers-reduced-motion`.

## Tono

Español rioplatense, tuteo cercano y profesional. Verbos de acción en los
botones («Probá gratis», no «Submit»). Cero tecnicismos.

## Seguridad

- Repo **público**: jamás subir `.env*`, tokens ni credenciales.
- Secretos sólo en variables de entorno; el código nunca las imprime en logs.
- Datos personales: consentimiento explícito, mínima data, baja en 1 toque
  (Ley 25.326).

## Fases del producto

Ver `README.md` (tabla de 4 fases + chequeos por fase). No adelantar features
de una fase posterior antes de cerrar los chequeos de la actual.

## Convenciones del código

- Mismo stack que los repos hermanos de POPUPS (`Mi-Tienda`, `subasta-argentina`):
  Next.js App Router + TS + Tailwind + ESLint; Supabase con RLS para datos.
- Nombres de archivos en inglés, contenido de la UI en español.
- Nada de dependencias nuevas sin verificar licencia (evitar AGPL en un SaaS).
