"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { api, BASE_PATH, type TarjetaData } from "@/lib/api";

type Fase = "cargando" | "sin-tarjeta" | "no-existe" | "lista";

export default function TarjetaCliente() {
  const [fase, setFase] = useState<Fase>("cargando");
  const [tarjeta, setTarjeta] = useState<TarjetaData | null>(null);
  const [camara, setCamara] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ultimoSello, setUltimoSello] = useState(-1);
  const [escaneando, setEscaneando] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const tarjetaRef = useRef<TarjetaData | null>(null);

  useEffect(() => {
    tarjetaRef.current = tarjeta;
  }, [tarjeta]);

  const cerrarCamara = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamara(false);
    setEscaneando(false);
  }, []);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const t = new URLSearchParams(window.location.search).get("t");
      if (!t) {
        await Promise.resolve();
        if (vivo) setFase("sin-tarjeta");
        return;
      }
      try {
        const datos = await api.tarjeta(t);
        if (vivo) {
          setTarjeta(datos);
          setFase("lista");
        }
      } catch {
        if (vivo) setFase("no-existe");
      }
    })();
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${BASE_PATH}/sw.js`).catch(() => null);
    }
    return () => {
      vivo = false;
      cerrarCamara();
    };
  }, [cerrarCamara]);

  const sellar = useCallback(
    async (payload: string) => {
      const actual = tarjetaRef.current;
      if (!actual) return;
      setEscaneando(true);
      try {
        const r = await api.sello(actual.id, payload);
        setTarjeta({
          ...actual,
          sello_count: r.sello_count,
          completa: r.completa
        });
        setUltimoSello(r.sello_count - 1);
        setMensaje("¡Sello puesto!");
        if (typeof navigator.vibrate === "function") navigator.vibrate(60);
      } catch (e) {
        setMensaje(api.err(e));
      } finally {
        setEscaneando(false);
        cerrarCamara();
      }
    },
    [cerrarCamara]
  );

  const abrirCamara = useCallback(async () => {
    setMensaje(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      streamRef.current = stream;
      setCamara(true);
      const video = document.createElement("video");
      video.srcObject = stream;
      video.playsInline = true;
      await video.play();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const loop = () => {
        if (!streamRef.current || !ctx || !video.videoWidth) {
          rafRef.current = requestAnimationFrame(loop);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height);
        if (code?.data?.startsWith("MS1|")) {
          streamRef.current = null;
          video.srcObject = null;
          stream.getTracks().forEach((t) => t.stop());
          cancelAnimationFrame(rafRef.current);
          sellar(code.data);
          return;
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setMensaje("No pudimos abrir la cámara. Revisá los permisos del navegador.");
    }
  }, [sellar]);

  useEffect(() => {
    if (camara && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => null);
    }
  }, [camara]);

  if (fase === "cargando") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-ink text-paper">
        <p className="animate-pulse text-sm tracking-wide">Cargando tu tarjeta…</p>
      </main>
    );
  }

  if (fase !== "lista" || !tarjeta) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-ink px-6 text-center text-paper">
        <p className="text-xl font-bold">Esa tarjeta no existe</p>
        <p className="max-w-xs text-sm text-grey">
          Puede que el link esté incompleto. Pedile uno nuevo al comercio.
        </p>
        <a
          href={`${BASE_PATH}/`}
          className="mt-2 rounded-full bg-lime px-6 py-3 text-sm font-bold text-ink"
        >
          Ver qué es Mis Sellos
        </a>
      </main>
    );
  }

  const { comercio, sello_count, canjeada, completa } = tarjeta;
  const meta = comercio.meta_sellos;
  const slots = Array.from({ length: meta }, (_, i) => i < sello_count);
  const falta = Math.max(0, meta - sello_count);

  return (
    <main className="relative flex min-h-dvh flex-col bg-ink text-paper">
      <header className="flex items-center justify-between px-5 py-4">
        <span className="text-sm font-black tracking-[0.2em] text-lime">
          MIS SELLOS
        </span>
        <span className="rounded-full border border-line px-3 py-1 text-[11px] text-grey">
          tarjeta digital
        </span>
      </header>

      <section className="flex flex-1 flex-col justify-center px-5 pb-32">
        <div className="fade-up rounded-[28px] border border-line bg-ink2 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
          <p className="text-xs uppercase tracking-[0.25em] text-grey">
            Tu tarjeta en
          </p>
          <h1 className="mt-1 text-3xl font-black leading-tight">
            {comercio.nombre}
          </h1>
          {comercio.premio && (
            <p className="mt-2 inline-block rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink">
              Premio: {comercio.premio}
            </p>
          )}

          <div className="mt-7 grid grid-cols-4 gap-3 sm:grid-cols-4">
            {slots.map((lleno, i) => (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center rounded-full text-lg font-black ${
                  lleno
                    ? i === ultimoSello
                      ? "stamp-in bg-lime text-ink"
                      : "bg-lime text-ink"
                    : "border-2 border-dashed border-line text-grey"
                }`}
              >
                {lleno ? "✓" : i + 1}
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-end justify-between border-t border-line pt-4">
            <p className="text-sm text-grey">
              {canjeada
                ? "Premio canjeado"
                : completa
                  ? "¡Tarjeta completa!"
                  : `Te faltan ${falta} ${falta === 1 ? "sello" : "sellos"}`}
            </p>
            <p className="text-2xl font-black text-lime">
              {sello_count}
              <span className="text-base text-grey">/{meta}</span>
            </p>
          </div>
        </div>

        {mensaje && (
          <p className="fade-up mt-4 rounded-2xl border border-line bg-ink2 px-4 py-3 text-center text-sm">
            {mensaje}
          </p>
        )}
      </section>

      <footer className="fixed inset-x-0 bottom-0 border-t border-line bg-ink/95 px-5 py-4 backdrop-blur">
        {canjeada ? (
          <p className="py-2 text-center text-sm font-bold text-lime">
            ¡Premio ya canjeado! Disfrutalo.
          </p>
        ) : completa ? (
          <p className="py-2 text-center text-sm font-bold text-lime">
            ¡Lista! Mostrale esta pantalla al comercio por tu premio.
          </p>
        ) : (
          <button
            type="button"
            onClick={abrirCamara}
            disabled={camara || escaneando}
            className="w-full rounded-full bg-lime px-6 py-4 text-base font-black text-ink transition hover:bg-lime2 active:scale-[0.98] disabled:opacity-60"
          >
            {escaneando
              ? "Sellando…"
              : camara
                ? "Apuntale al QR del comercio…"
                : "Escanear QR para sellar"}
          </button>
        )}
      </footer>

      {camara && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            <div className="h-64 w-64 rounded-[32px] border-4 border-lime shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
            <p className="rounded-full bg-ink/80 px-4 py-2 text-sm">
              Centrá el QR del comercio
            </p>
          </div>
          <button
            type="button"
            onClick={cerrarCamara}
            className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-full border border-line bg-ink px-6 py-3 text-sm font-bold"
          >
            Cancelar
          </button>
        </div>
      )}
    </main>
  );
}
