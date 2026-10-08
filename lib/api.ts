export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://mis-sellos-api.somospopups.workers.dev";

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

type ErrShape = { ok?: boolean; error?: string };

async function call<T>(
  path: string,
  method: "GET" | "POST",
  body?: unknown,
  acceso?: string
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body) headers["content-type"] = "application/json";
  if (acceso) headers["x-acceso"] = acceso;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError("sin_red", 0);
  }
  let data: ErrShape;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok || data.ok === false)
    throw new ApiError(data.error ?? "error_interno", res.status);
  return data as T;
}

export type Comercio = {
  id: string;
  slug: string;
  nombre: string;
  premio: string | null;
  meta_sellos: number;
};

export type PanelData = {
  ok: true;
  comercio: Comercio;
  sellos_hoy: number;
  tarjetas_activas: number;
  tarjetas: {
    id: string;
    created_at: string;
    sello_count: number;
    canjeada_at: string | null;
  }[];
};

export type TarjetaData = {
  ok: true;
  id: string;
  sello_count: number;
  canjeada: boolean;
  completa: boolean;
  comercio: {
    nombre: string;
    premio: string | null;
    meta_sellos: number;
    slug: string;
  };
};

export type TokenData = {
  ok: true;
  payload: string;
  bucket: number;
  expira_en: number;
};

export type SelloData = {
  ok: true;
  repetido?: boolean;
  sello_count: number;
  completa: boolean;
};

export const api = {
  crearComercio: (body: {
    nombre: string;
    premio?: string;
    meta_sellos?: number;
  }) =>
    call<{ ok: true; id: string; slug: string; acceso: string; nombre: string }>(
      "/api/comercios",
      "POST",
      body
    ),
  acceso: (ref: string, acceso: string) =>
    call<{ ok: true; comercio: Comercio }>(
      "/api/comercios/acceso",
      "POST",
      { id: ref, acceso }
    ),
  panel: (id: string, acceso: string) =>
    call<PanelData>(`/api/comercios/${id}`, "GET", undefined, acceso),
  token: (id: string, acceso: string) =>
    call<TokenData>(`/api/comercios/${id}/token`, "GET", undefined, acceso),
  crearTarjeta: (id: string, acceso: string) =>
    call<{ ok: true; id: string }>(
      `/api/comercios/${id}/tarjetas`,
      "POST",
      {},
      acceso
    ),
  tarjeta: (t: string) => call<TarjetaData>(`/api/tarjeta?t=${t}`, "GET"),
  sello: (tarjeta_id: string, payload: string) =>
    call<SelloData>("/api/sello", "POST", { tarjeta_id, payload }),
  canje: (tarjeta_id: string, acceso: string) =>
    call<{ ok: true; canjeada_at: string }>(
      "/api/canje",
      "POST",
      { tarjeta_id },
      acceso
    ),
  err: (e: unknown): string => {
    const code = e instanceof ApiError ? e.code : "error";
    switch (code) {
      case "sin_red":
        return "Sin conexión. Fijate que andes los datos y probá de nuevo.";
      case "acceso_rechazado":
        return "Código incorrecto.";
      case "no_existe":
        return "No encontramos eso. Fijate el link.";
      case "muy_seguido":
        return "¡Todavía no! Esperá un ratito antes de sellar de nuevo.";
      case "qr_invalido":
        return "Ese QR no es válido o ya venció. Que el comercio muestre el suyo.";
      case "ya_canjeada":
        return "Esa tarjeta ya fue canjeada.";
      case "incompleta":
        return "La tarjeta todavía está incompleta.";
      case "ya_sellada":
        return "Ese sello ya estaba.";
      default:
        return "Algo salió mal. Probá de nuevo en un momento.";
    }
  }
};
