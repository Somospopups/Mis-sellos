import { VERSION } from "@/lib/version";

const PROMESAS = [
  {
    n: "1",
    titulo: "Vive en el celular",
    texto:
      "El cliente la guarda en Apple Wallet o Google Wallet. No instala nada, no se olvida la tarjeta en casa y no hay plástico que se pierda.",
  },
  {
    n: "2",
    titulo: "Sello en dos toques",
    texto:
      "Abrís, apuntás al código y listo: el sello se aplica al instante, aunque el local esté sin internet. Nunca frenás la fila.",
  },
  {
    n: "3",
    titulo: "Sabe quién dejó de venir",
    texto:
      "El panel te muestra a quién no ves hace días para que lo invite de vuelta antes de que se le olvide tu café.",
  },
];

const PASOS = [
  {
    n: "1",
    titulo: "Creás tu tarjeta",
    texto: "Nombre, logo y regla: “10 sellos, el 11º café gratis”. Listo en 10 minutos.",
  },
  {
    n: "2",
    titulo: "Lo ponés en la caja",
    texto: "Imprimís el QR de mostrador. Tus clientes escanean y la tarjeta queda en su celular.",
  },
  {
    n: "3",
    titulo: "Sellás y mirás",
    texto: "Cada visita suma. Ellos ven el progreso, vos ves quién volvió y quién se está enfriando.",
  },
];

const PLANES = [
  {
    nombre: "Gratis",
    precio: "$0",
    detalle: "para probarlo en tu comercio",
    incluye: [
      "1 programa de sellos",
      "Hasta 100 clientes activos",
      "Tarjeta en el celular del cliente",
      "Código anti-fraude rotativo",
    ],
    destacado: false,
    cta: "Empezar gratis",
  },
  {
    nombre: "Pro",
    precio: "Próximamente",
    detalle: "para comercios que ya lo usan todos los días",
    incluye: [
      "Clientes ilimitados",
      "Panel de actividad y exportación",
      "PIN para canjear premios",
      "Soporte por WhatsApp",
    ],
    destacado: false,
    cta: "Lista de espera",
  },
  {
    nombre: "Pro+",
    precio: "Próximamente",
    detalle: "para los que quieren que vuelvan",
    incluye: [
      "Todo lo del Pro",
      "Tarjeta en Apple y Google Wallet",
      "Radar de quién dejó de venir",
      "Reactivación con un toque",
    ],
    destacado: true,
    cta: "Lista de espera",
  },
];

function Sello({ lleno, i }: { lleno: boolean; i: number }) {
  return (
    <div
      className={[
        "flex h-11 w-11 items-center justify-center rounded-full text-lg sm:h-12 sm:w-12",
        lleno
          ? "bg-lime text-ink font-bold shadow-[0_2px_0_rgba(5,5,5,.35)]"
          : "border-2 border-dashed border-line text-grey",
        lleno && i === 6 ? "stamp-in stamp-in-7" : "",
      ].join(" ")}
      aria-hidden
    >
      {lleno ? "☕" : "·"}
    </div>
  );
}

export default function Home() {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-inkline bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3.5">
          <a href={`${base}/`} className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-sm text-lime">
              ✓
            </span>
            Mis Sellos
          </a>
          <nav className="hidden items-center gap-6 text-sm font-medium text-ink/70 sm:flex">
            <a href="#como-funciona" className="hover:text-ink">
              Cómo funciona
            </a>
            <a href="#precios" className="hover:text-ink">
              Precios
            </a>
            <a href={`${base}/panel/`} className="hover:text-ink">
              Panel
            </a>
          </nav>
          <a
            href={`${base}/panel/`}
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-transform hover:scale-[1.03] active:scale-95"
          >
            Probá gratis
          </a>
        </div>
      </header>

      <section className="bg-ink text-paper">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 pb-20 pt-14 sm:grid-cols-2 sm:pb-28 sm:pt-20">
          <div>
            <span className="fade-up inline-block rounded-full border border-lime/40 bg-lime/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-lime">
              Para cafés y comercios de barrio
            </span>
            <h1 className="fade-up fade-up-2 mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              La tarjeta de sellos que <span className="text-lime">no se pierde</span>.
            </h1>
            <p className="fade-up fade-up-2 mt-5 max-w-md text-lg leading-relaxed text-grey">
              Vive en el celular de tus clientes. Vos sellás en dos toques. Y sabés
              exactamente quién dejó de venir.
            </p>
            <div className="fade-up fade-up-3 mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={`${base}/panel/`}
                className="rounded-full bg-lime px-6 py-3.5 text-center font-semibold text-ink transition-transform hover:scale-[1.03] active:scale-95"
              >
                Empezar gratis
              </a>
              <a
                href="#como-funciona"
                className="rounded-full border border-line px-6 py-3.5 text-center font-semibold text-paper transition-colors hover:bg-white/5"
              >
                Ver cómo funciona
              </a>
            </div>
            <p className="mt-5 text-sm text-grey">
              Sin app para el cliente · Listo en 10 minutos
            </p>
          </div>

          <div className="fade-up fade-up-2">
            <div className="float mx-auto max-w-[420px] rounded-[28px] border border-line bg-ink2 p-6 shadow-[0_30px_60px_-20px_rgba(0,0,0,.6)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-grey">
                    Café La Esquina
                  </p>
                  <p className="mt-1 text-lg font-bold text-paper">Tu tarjeta</p>
                </div>
                <span className="rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink">
                  7/10
                </span>
              </div>
              <div className="mt-5 grid grid-cols-5 gap-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Sello key={i} i={i} lleno={i < 7} />
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-white/5 px-4 py-3 text-sm text-paper">
                ¡Te faltan <span className="font-bold text-lime">3 sellos</span> para tu
                café gratis!
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-grey">
                <span>Apple Wallet · Google Wallet</span>
                <span>se actualiza sola ✓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-paper text-ink">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:py-24">
          <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
            Tres cosas que cambian el día a día
          </h2>
          <p className="mt-3 max-w-xl text-ink/60">
            Lo que hoy es una cartulina que se moja, se pierde o se queda en casa.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {PROMESAS.map((p) => (
              <article
                key={p.n}
                className="rounded-[28px] border border-inkline bg-white p-6 transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(5,5,5,.45)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-lime">
                  {p.n}
                </span>
                <h3 className="mt-4 text-xl font-bold">{p.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{p.texto}</p>
              </article>
            ))}
          </div>

          <h2 className="mt-16 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
            Cómo se usa
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {PASOS.map((p) => (
              <div
                key={p.n}
                className="rounded-[28px] bg-ink p-6 text-paper"
              >
                <p className="text-sm font-semibold text-lime">Paso {p.n}</p>
                <h3 className="mt-2 text-lg font-bold">{p.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-grey">{p.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="precios" className="bg-ink text-paper">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:py-24">
          <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, como debe ser
          </h2>
          <p className="mt-3 max-w-xl text-grey">
            Empezás gratis. Cuando te sirva, pasás al plan que te toca. Sin contratos.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {PLANES.map((plan) => (
              <article
                key={plan.nombre}
                className={[
                  "flex flex-col rounded-[28px] border p-6",
                  plan.destacado
                    ? "border-lime bg-lime/10"
                    : "border-line bg-ink2",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{plan.nombre}</h3>
                  {plan.destacado && (
                    <span className="rounded-full bg-lime px-2.5 py-0.5 text-xs font-bold text-ink">
                      El que viene
                    </span>
                  )}
                </div>
                <p
                  className={[
                    "mt-4 text-3xl font-bold tracking-tight",
                    plan.precio === "Próximamente" ? "text-grey" : "text-lime",
                  ].join(" ")}
                >
                  {plan.precio}
                </p>
                <p className="mt-1 text-sm text-grey">{plan.detalle}</p>
                <ul className="mt-5 flex-1 space-y-2.5 text-sm text-paper/85">
                  {plan.incluye.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-lime">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={
                    plan.nombre === "Gratis"
                      ? `${base}/panel/`
                      : "mailto:somospopups@gmail.com?subject=Mis%20Sellos"
                  }
                  className={[
                    "mt-6 rounded-full px-5 py-3 text-center text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-95",
                    plan.destacado
                      ? "bg-lime text-ink"
                      : "border border-line text-paper hover:bg-white/5",
                  ].join(" ")}
                >
                  {plan.cta}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-ink text-grey">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-semibold text-paper">Mis Sellos</span> — una
            iniciativa de POPUPS.
          </p>
          <p>
            <a href="mailto:somospopups@gmail.com" className="hover:text-paper">
              somospopups@gmail.com
            </a>
            <span className="mx-2 text-line">·</span>
            v{VERSION}
          </p>
        </div>
      </footer>
    </div>
  );
}
