# Mis Sellos

**La tarjeta de sellos que no se pierde.** Tarjeta de fidelidad digital para cafés
y comercios de barrio: vive en el celular del cliente (Apple Wallet / Google
Wallet, sin app), el comercio sella en dos toques y el panel muestra quién dejó
de venir.

Proyecto propio de **POPUPS** (Córdoba, Argentina) · somospopups@gmail.com

**Demo en vivo:** https://somospopups.github.io/Mis-sellos/

> Idea original: la serie de build-in-public de @muscabrera («Sellala #001»),
> desarrollada con el método POPUPS: Escuchamos → Simplificamos → Diseñamos →
> Construimos → Acompañamos.

## El problema

La tarjeta de cartón de los cafés se moja, se pierde o se queda en casa. Y el
comercio no sabe nada: no quién viene, no quién dejó de venir.

## Qué construimos

1. **En el celular del cliente** — queda como acceso directo en la pantalla de
   inicio (PWA), sin instalar nada.
2. **Sello en dos toques** — el cliente abre su tarjeta y escanea el QR del
   comercio. El QR rota cada 30 segundos y no se puede repetir: nadie sella
   dos veces con el mismo código.
3. **Radar de abandono** — el panel prioriza a los clientes que se están
   enfriando, con la cadencia esperada de cada rubro.

## Plan por fases

| Fase | Qué entra | Qué NO entra | Duración |
| --- | --- | --- | --- |
| **1. Tarjeta web (sin Wallet)** ✅ | Alta de comercio ≤10 min, QR de mostrador, tarjeta PWA, sello en 2 toques con código rotativo, panel básico | Wallet, churn, WhatsApp, Mercado Pago, multi-sucursal | 6–8 sem |
| **2. Wallet** | Google Wallet (gratis) + Apple `.pkpass` con push (el sello aparece en el celu sin abrir nada). Si Wallet falla, la PWA sigue funcionando | NFC, Samsung Wallet | 3–4 sem |
| **3. Radar + reactivación** | Cadencia por rubro, lista «dejó de venir», reactivación por WhatsApp Cloud API | ML, campañas multi-paso | 3–4 sem |
| **4. Integraciones** | Mercado Pago (sello automático al cobrar + cobro de suscripción en ARS), multi-sucursal, prepago | POS internacionales, app nativa | 4–6 sem |

**Estado actual: ✅ Fase 1 completada** — alta de comercio + panel, tarjeta PWA,
sello QR rotativo anti-fraude, canje, API en Cloudflare Workers + D1 y e2e en verde.

### Chequeos de cada fase (definición de «funciona estupendamente bien»)

- Sello completo en **≤2 toques y ≤2 segundos** (p95, medido en comercios reales).
- Sin conexión: la tarjeta se ve igual (cache); sellar avisa «sin conexión» y
  el cliente reintenta — el QR nunca se reutiliza.
- Wallet: sello visible en ≤5 s (Apple) / ≤10 s (Google) en ≥90% de intentos.
- Alta de comercio ≤10 minutos, sin ayuda técnica.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript** + **Tailwind 4** + ESLint
- PWA (manifest + service worker + iconos) ✅
- **Cloudflare Workers + D1** — API `mis-sellos-api` (`worker/`), HMAC-SHA256
  rotativo anti-fraude, rate limit y modo self con tope diario
- QR: `qrcode` (panel) + `jsqr` (cámara del cliente)
- Emisión de passes: `passkit-generator` (MIT) para Apple, JWT + service
  account para Google — *pendiente en Fase 2*

## Cómo correr

```bash
npm install
npm run dev        # http://localhost:3000

# API (requiere wrangler logueado)
cd worker
npx wrangler dev                      # http://127.0.0.1:8787
```

Chequeos obligatorios antes de cerrar cualquier tarea:

```bash
npm run lint
npx next typegen
npx tsc --noEmit
npm run build
```

Smoke test del flujo crítico (contra la API desplegada): alta → tarjeta →
sello → sello repetido rechazado → QR forjado rechazado → canje → doble
canje rechazado.

## Publicación

Cada push a `main` despliega automáticamente en **GitHub Pages**
(`.github/workflows/deploy.yml`): lint + tsc + build estático
(`output: export` con `NEXT_PUBLIC_BASE_PATH=/Mis-sellos`) y deploy.
La landing es 100% estática, por eso puede vivir en Pages sin servidor.

El API se despliega a mano desde `worker/`:

```bash
cd worker
npx wrangler deploy
# esquema (sólo al crear o migrar):
npx wrangler d1 execute mis-sellos --remote --file schema.sql
```

El secreto `SELLO_SECRET` vive en Wrangler/secrets, jamás en el repo.

## Versionado

La fuente de verdad es la constante `VERSION` en `lib/version.ts`. Sube de 1 en
1, sin decimales: cada cambio publicado consume un número. Al terminar cada
tarea se cierra con `v<N> funcionando!`.

## Estructura

```
.github/workflows/
  deploy.yml      # build + deploy automático a GitHub Pages
app/
  layout.tsx      # idioma, metadata, fuentes, manifest
  page.tsx        # landing
  c/page.tsx      # tarjeta del cliente (PWA: cámara, estampas, estados)
  panel/page.tsx  # panel del comercio (alta, QR rotativo, tarjetas, canje)
  globals.css     # paleta POPUPS + animaciones (con reduced-motion)
lib/
  api.ts          # cliente HTTP del API + mensajes de error en criollo
  version.ts      # fuente de verdad del versionado
public/
  sw.js                 # service worker (navegaciones network-first)
  manifest.webmanifest  # PWA
  icon-192.png / icon-512.png
worker/
  index.js        # API (Workers): /api/comercios, /tarjeta, /sello, /canje
  schema.sql      # tablas D1: comercios, tarjetas, sellos
  wrangler.jsonc  # binding DB + account
```

## Identidad visual

Paleta POPUPS extraída de [somospopups.netlify.app](https://somospopups.netlify.app/):
tinta `#050505`, verde lima `#c8f810`, papel `#f3f3ee`, gris `#aaaDA4`,
radio 28px. Pendiente de confirmación en
`popups/referencias/identidad-visual.md` — no inventar colores nuevos.

## Seguridad

Repo **público**: nunca subir `.env` ni credenciales. Todo secreto vive en
variables de entorno (`.env.local`, ignorado por git) o en los secrets del
Worker (`SELLO_SECRET`). El código jamás las imprime en logs.

---

Todos los derechos reservados — POPUPS.
