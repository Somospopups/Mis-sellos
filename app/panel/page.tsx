"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { api, BASE_PATH, type PanelData, type TokenData } from "@/lib/api";

type Sesion = { id: string; acceso: string; nombre: string };
type Alta = { id: string; slug: string; acceso: string; nombre: string };

const CLAVE = "mis-sellos-panel";

function leerSesion(): Sesion | null {
  try {
    const raw = localStorage.getItem(CLAVE);
    return raw ? (JSON.parse(raw) as Sesion) : null;
  } catch {
    return null;
  }
}

export default function Panel() {
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [datos, setDatos] = useState<PanelData | null>(null);
  const [token, setToken] = useState<TokenData | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrNueva, setQrNueva] = useState<string | null>(null);
  const [nuevaId, setNuevaId] = useState<string | null>(null);
  const [ref, setRef] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [vence, setVence] = useState(0);
  const [modo, setModo] = useState<"login" | "alta">("login");
  const [altaCreada, setAltaCreada] = useState<Alta | null>(null);
  const [nombreAlta, setNombreAlta] = useState("");
  const [premioAlta, setPremioAlta] = useState("");
  const [metaAlta, setMetaAlta] = useState(8);

  const refrescar = useCallback(async (s: Sesion) => {
    try {
      const p = await api.panel(s.id, s.acceso);
      setDatos(p);
      const t = await api.token(s.id, s.acceso);
      setToken(t);
      setVence(Date.now() + t.expira_en);
      setSegundos(Math.ceil(t.expira_en / 1000));
    } catch (e) {
      if (e instanceof Error && e.message === "acceso_rechazado") {
        localStorage.removeItem(CLAVE);
        setSesion(null);
        setError("Código incorrecto. Entrá de nuevo.");
      }
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const s = leerSesion();
      if (!s) return;
      await Promise.resolve();
      if (!vivo) return;
      setSesion(s);
      refrescar(s);
    })();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${BASE_PATH}/sw.js`).catch(() => null);
    }
    return () => {
      vivo = false;
    };
  }, [refrescar]);

  useEffect(() => {
    if (!sesion) return;
    const refresh = setInterval(() => refrescar(sesion), 20000);
    const reloj = setInterval(() => {
      setSegundos(
        vence ? Math.max(0, Math.ceil((vence - Date.now()) / 1000)) : 0
      );
    }, 1000);
    return () => {
      clearInterval(refresh);
      clearInterval(reloj);
    };
  }, [sesion, refrescar, vence]);

  useEffect(() => {
    if (!token) return;
    QRCode.toDataURL(token.payload, {
      margin: 1,
      width: 640,
      color: { dark: "#050505", light: "#c8f810" }
    })
      .then(setQrToken)
      .catch(() => null);
  }, [token]);

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const r = await api.acceso(ref.trim(), codigo.trim());
      const s: Sesion = {
        id: r.comercio.id,
        acceso: codigo.trim(),
        nombre: r.comercio.nombre
      };
      localStorage.setItem(CLAVE, JSON.stringify(s));
      setSesion(s);
      await refrescar(s);
    } catch (err) {
      setError(api.err(err));
    } finally {
      setCargando(false);
    }
  };

  const crearAlta = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const r = await api.crearComercio({
        nombre: nombreAlta.trim(),
        premio: premioAlta.trim() || undefined,
        meta_sellos: metaAlta
      });
      setAltaCreada({
        id: r.id,
        slug: r.slug,
        acceso: r.acceso,
        nombre: r.nombre
      });
    } catch (err) {
      setError(api.err(err));
    } finally {
      setCargando(false);
    }
  };

  const confirmarAlta = async () => {
    if (!altaCreada) return;
    const s: Sesion = {
      id: altaCreada.id,
      acceso: altaCreada.acceso,
      nombre: altaCreada.nombre
    };
    localStorage.setItem(CLAVE, JSON.stringify(s));
    setSesion(s);
    setAltaCreada(null);
    await refrescar(s);
  };

  const salir = () => {
    localStorage.removeItem(CLAVE);
    setSesion(null);
    setDatos(null);
    setToken(null);
    setRef("");
    setCodigo("");
  };

  const nuevaTarjeta = async () => {
    if (!sesion) return;
    setError(null);
    try {
      const r = await api.crearTarjeta(sesion.id, sesion.acceso);
      setNuevaId(r.id);
      const url = `${window.location.origin}${BASE_PATH}/c/?t=${r.id}`;
      const img = await QRCode.toDataURL(url, {
        margin: 1,
        width: 640,
        color: { dark: "#050505", light: "#c8f810" }
      });
      setQrNueva(img);
      await refrescar(sesion);
    } catch (e) {
      setError(api.err(e));
    }
  };

  const canjear = async (tarjetaId: string) => {
    if (!sesion) return;
    try {
      await api.canje(tarjetaId, sesion.acceso);
      await refrescar(sesion);
    } catch (e) {
      setError(api.err(e));
    }
  };

  if (!sesion) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-paper px-5 text-ink">
        <div className="w-full max-w-sm">
          <p className="text-sm font-black tracking-[0.25em] text-ink">
            MIS SELLOS
          </p>

          {altaCreada ? (
            <div className="fade-up mt-6 rounded-[28px] bg-ink p-6 text-paper">
              <p className="text-xs uppercase tracking-[0.25em] text-lime">
                Comercio creado
              </p>
              <h1 className="mt-2 text-2xl font-black leading-tight">
                {altaCreada.nombre}
              </h1>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-ink2 p-4">
                  <p className="text-[11px] text-grey">Tu código de acceso</p>
                  <p className="font-mono text-2xl font-black tracking-[0.3em] text-lime">
                    {altaCreada.acceso}
                  </p>
                </div>
                <div className="rounded-2xl bg-ink2 p-4">
                  <p className="text-[11px] text-grey">Tu referencia</p>
                  <p className="font-mono text-sm font-bold">
                    {altaCreada.slug}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-grey">
                Guardalos: con el código entrás al panel desde cualquier
                celular. Se muestra una sola vez.
              </p>
              <button
                type="button"
                onClick={confirmarAlta}
                className="mt-5 w-full rounded-full bg-lime px-6 py-4 text-sm font-black text-ink transition hover:bg-lime2 active:scale-[0.98]"
              >
                Entrar al panel
              </button>
            </div>
          ) : modo === "alta" ? (
            <>
              <h1 className="mt-2 text-3xl font-black leading-tight">
                Creá tu comercio
              </h1>
              <p className="mt-2 text-sm text-ink/60">
                Dos minutos y empezás a sellar. Sin tarjetas de crédito.
              </p>
              <form onSubmit={crearAlta} className="mt-8 flex flex-col gap-3">
                <input
                  value={nombreAlta}
                  onChange={(e) => setNombreAlta(e.target.value)}
                  placeholder="Nombre del comercio"
                  maxLength={60}
                  className="rounded-2xl border border-inkline bg-white px-4 py-3.5 text-sm outline-none focus:border-ink"
                  required
                />
                <input
                  value={premioAlta}
                  onChange={(e) => setPremioAlta(e.target.value)}
                  placeholder="¿Qué gana con 8 sellos? (ej: café gratis)"
                  maxLength={80}
                  className="rounded-2xl border border-inkline bg-white px-4 py-3.5 text-sm outline-none focus:border-ink"
                />
                <select
                  value={metaAlta}
                  onChange={(e) => setMetaAlta(Number(e.target.value))}
                  className="rounded-2xl border border-inkline bg-white px-4 py-3.5 text-sm outline-none focus:border-ink"
                >
                  <option value={6}>Tarjeta de 6 sellos</option>
                  <option value={8}>Tarjeta de 8 sellos</option>
                  <option value={10}>Tarjeta de 10 sellos</option>
                  <option value={12}>Tarjeta de 12 sellos</option>
                </select>
                {error && (
                  <p className="rounded-xl bg-ink px-4 py-3 text-xs text-paper">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={cargando}
                  className="mt-1 rounded-full bg-ink px-6 py-4 text-sm font-black text-lime transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                >
                  {cargando ? "Creando…" : "Crear mi comercio"}
                </button>
              </form>
              <button
                type="button"
                onClick={() => setModo("login")}
                className="mt-4 w-full text-center text-xs text-ink/50 underline"
              >
                Ya tengo comercio, entrar
              </button>
            </>
          ) : (
            <>
              <h1 className="mt-2 text-3xl font-black leading-tight">
                Panel del comercio
              </h1>
              <p className="mt-2 text-sm text-ink/60">
                Entrá con tu referencia y tu código de 6 dígitos.
              </p>
              <form onSubmit={entrar} className="mt-8 flex flex-col gap-3">
                <input
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  placeholder="Tu referencia (ej: bar-el-clasico-f2f6)"
                  className="rounded-2xl border border-inkline bg-white px-4 py-3.5 text-sm outline-none focus:border-ink"
                  required
                />
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Código de 6 dígitos"
                  inputMode="numeric"
                  maxLength={6}
                  className="rounded-2xl border border-inkline bg-white px-4 py-3.5 text-sm tracking-[0.3em] outline-none focus:border-ink"
                  required
                />
                {error && (
                  <p className="rounded-xl bg-ink px-4 py-3 text-xs text-paper">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={cargando}
                  className="mt-1 rounded-full bg-ink px-6 py-4 text-sm font-black text-lime transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                >
                  {cargando ? "Entrando…" : "Entrar"}
                </button>
              </form>
              <button
                type="button"
                onClick={() => setModo("alta")}
                className="mt-4 w-full rounded-full border border-ink px-6 py-3.5 text-sm font-black"
              >
                Soy nuevo, crear mi comercio
              </button>
            </>
          )}

          <a
            href={`${BASE_PATH}/`}
            className="mt-6 block text-center text-xs text-ink/50 underline"
          >
            ¿Qué es Mis Sellos?
          </a>
        </div>
      </main>
    );
  }

  const meta = datos?.comercio.meta_sellos ?? 8;

  return (
    <main className="min-h-dvh bg-paper pb-16 text-ink">
      <header className="sticky top-0 z-20 border-b border-inkline bg-paper/85 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.25em]">
              MIS SELLOS
            </p>
            <p className="text-lg font-black leading-tight">{sesion.nombre}</p>
          </div>
          <button
            type="button"
            onClick={salir}
            className="rounded-full border border-inkline px-4 py-2 text-xs font-bold"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-xl flex-col gap-5 px-5 pt-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[24px] bg-ink px-5 py-4 text-paper">
            <p className="text-3xl font-black text-lime">
              {datos?.sellos_hoy ?? 0}
            </p>
            <p className="mt-1 text-xs text-grey">Sellos hoy</p>
          </div>
          <div className="rounded-[24px] bg-ink px-5 py-4 text-paper">
            <p className="text-3xl font-black text-lime">
              {datos?.tarjetas_activas ?? 0}
            </p>
            <p className="mt-1 text-xs text-grey">Tarjetas activas</p>
          </div>
        </div>

        <section className="rounded-[28px] bg-ink p-6 text-center text-paper">
          <p className="text-xs uppercase tracking-[0.25em] text-grey">
            QR para sellar
          </p>
          <p className="mt-1 text-sm">
            El cliente lo escanea desde su tarjeta
          </p>
          <div className="mx-auto mt-4 w-full max-w-[260px] overflow-hidden rounded-[20px] bg-lime">
            {qrToken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrToken} alt="QR para sellar" className="w-full" />
            ) : (
              <div className="aspect-square w-full animate-pulse" />
            )}
          </div>
          <p className="mt-3 text-xs text-grey">
            Se renueva solo en {segundos}s — no se puede repetir
          </p>
        </section>

        <button
          type="button"
          onClick={nuevaTarjeta}
          className="rounded-full bg-lime px-6 py-4 text-sm font-black text-ink transition hover:bg-lime2 active:scale-[0.98]"
        >
          + Nueva tarjeta para un cliente
        </button>

        {nuevaId && qrNueva && (
          <section className="fade-up rounded-[28px] border border-inkline bg-white p-6 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-ink/50">
              Tarjeta creada
            </p>
            <p className="mt-1 text-sm text-ink/70">
              Mandale este QR o el link por WhatsApp
            </p>
            <div className="mx-auto mt-4 w-full max-w-[260px] overflow-hidden rounded-[20px] border border-inkline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrNueva} alt="QR de la tarjeta" className="w-full" />
            </div>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard
                  .writeText(
                    `${window.location.origin}${BASE_PATH}/c/?t=${nuevaId}`
                  )
                  .then(() => setError(null))
                  .catch(() => setError("No pudimos copiar. Copialo a mano."))
              }
              className="mt-4 w-full rounded-full border border-ink px-5 py-3 text-xs font-black"
            >
              Copiar link de la tarjeta
            </button>
            <button
              type="button"
              onClick={() => {
                setNuevaId(null);
                setQrNueva(null);
              }}
              className="mt-2 w-full py-2 text-xs text-ink/50 underline"
            >
              Cerrar
            </button>
          </section>
        )}

        {error && (
          <p className="rounded-2xl bg-ink px-4 py-3 text-center text-xs text-paper">
            {error}
          </p>
        )}

        <section>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-ink/50">
            Tus tarjetas
          </p>
          {!datos || datos.tarjetas.length === 0 ? (
            <p className="rounded-[24px] border border-dashed border-inkline px-5 py-8 text-center text-sm text-ink/50">
              Todavía no tenés tarjetas. Creá la primera.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {datos.tarjetas.map((t) => {
                const completa = t.sello_count >= meta && !t.canjeada_at;
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-[24px] border border-inkline bg-white px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs text-ink/50">
                        {t.id.slice(0, 10)}…
                      </p>
                      <p className="mt-0.5 text-sm font-bold">
                        {t.sello_count}/{meta} sellos
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {t.canjeada_at ? (
                        <span className="rounded-full bg-ink px-3 py-1.5 text-[11px] font-bold text-lime">
                          Canjeada
                        </span>
                      ) : completa ? (
                        <button
                          type="button"
                          onClick={() => canjear(t.id)}
                          className="rounded-full bg-lime px-3 py-1.5 text-[11px] font-black text-ink hover:bg-lime2"
                        >
                          Canjear
                        </button>
                      ) : (
                        <span className="rounded-full border border-inkline px-3 py-1.5 text-[11px] font-bold text-ink/60">
                          En curso
                        </span>
                      )}
                      <a
                        href={`${BASE_PATH}/c/?t=${t.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold underline"
                      >
                        Ver
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
