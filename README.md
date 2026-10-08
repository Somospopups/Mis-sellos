# Mis Sellos

**La tarjeta de sellos que no se pierde.** Tarjeta de fidelidad digital para cafés
y comercios de barrio: vive en el celular del cliente (Apple Wallet / Google
Wallet, sin app), el comercio sella en dos toques y el panel muestra quién dejó
de venir.

Proyecto propio de **POPUPS** (Córdoba, Argentina) · somospopups@gmail.com

> Idea original: la serie de build-in-public de @muscabrera («Sellala #001»),
> desarrollada con el método POPUPS: Escuchamos → Simplificamos → Diseñamos →
> Construimos → Acompañamos.

## El problema

La tarjeta de cartón de los cafés se moja, se pierde o se queda en casa. Y el
comercio no sabe nada: no quién viene, no quién dejó de venir.

## Qué construimos

1. **En el celular del cliente** — se guarda en Wallet o como acceso directo en
   la pantalla de inicio. Cero instalaciones.
2. **Sello en dos toques** — cámara → código → confirmación. Con código
   rotativo anti-fraude y modo offline (si no hay internet, el sello se encola
   y se sincroniza solo; nunca se frená la fila).
3. **Radar de abandono** — el panel prioriza a los clientes que se están
   enfriando, con la cadencia esperada de cada rubro.

## Plan por fases

| Fase | Qué entra | Qué NO entra | Duración |
| --- | --- | --- | --- |
| **1. Tarjeta web (sin Wallet)** | Alta de comercio ≤10 min, QR de mostrador, tarjeta PWA, sello en 2 toques con código rotativo + offline, panel básico | Wallet, churn, WhatsApp, Mercado Pago, multi-sucursal | 6–8 sem |
| **2. Wallet** | Google Wallet (gratis) + Apple `.pkpass` con push (el sello aparece en el celu sin abrir nada). Si Wallet falla, la PWA sigue funcionando | NFC, Samsung Wallet | 3–4 sem |
| **3. Radar + reactivación** | Cadencia por rubro, lista «dejó de venir», reactivación por WhatsApp Cloud API | ML, campañas multi-paso | 3–4 sem |
| **4. Integraciones** | Mercado Pago (sello automático al cobrar + cobro de suscripción en ARS), multi-sucursal, prepago | POS internacionales, app nativa | 4–6 sem |

**Estado actual: esqueleto (landing + base Next.js). La Fase 1 está pendiente.**

### Chequeos de cada fase (definición de «funciona estupendamente bien»)

- Sello completo en **≤2 toques y ≤2 segundos** (p95, medido en comercios reales).
- Offline: **0 sellos perdidos** con 1 hora de red caída.
- Wallet: sello visible en ≤5 s (Apple) / ≤10 s (Google) en ≥90% de intentos.
- Alta de comercio ≤10 minutos, sin ayuda técnica.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** + **Tailwind 4** + ESLint
- PWA (manifest + service worker) — *pendiente en Fase 1*
- Supabase (Postgres + Auth + RLS multi-tenant) — *pendiente en Fase 1*
- Emisión de passes: `passkit-generator` (MIT) para Apple, JWT + service
  account para Google — *pendiente en Fase 2*

## Cómo correr

```bash
npm install
npm run dev        # http://localhost:3000
```

Chequeos obligatorios antes de cerrar cualquier tarea:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Versionado

La fuente de verdad es la constante `VERSION` en `lib/version.ts`. Sube de 1 en
1, sin decimales: cada cambio publicado consume un número. Al terminar cada
tarea se cierra con `v<N> funcionando!`.

## Estructura

```
app/
  layout.tsx      # idioma, metadata, fuentes
  page.tsx        # landing
  globals.css     # paleta POPUPS + animaciones (con reduced-motion)
lib/
  version.ts      # fuente de verdad del versionado
```

## Identidad visual

Paleta POPUPS extraída de [somospopups.netlify.app](https://somospopups.netlify.app/):
tinta `#050505`, verde lima `#c8f810`, papel `#f3f3ee`, gris `#aaaDA4`,
radio 28px. Pendiente de confirmación en
`popups/referencias/identidad-visual.md` — no inventar colores nuevos.

## Seguridad

Repo **público**: nunca subir `.env` ni credenciales. Todo secreto vive en
variables de entorno (`.env.local`, ignorado por git).

---

Todos los derechos reservados — POPUPS.
