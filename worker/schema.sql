CREATE TABLE IF NOT EXISTS comercios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  acceso_hash TEXT NOT NULL,
  premio TEXT,
  meta_sellos INTEGER NOT NULL DEFAULT 8,
  created_at TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tarjetas (
  id TEXT PRIMARY KEY,
  comercio_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  sello_count INTEGER NOT NULL DEFAULT 0,
  canjeada_at TEXT
);

CREATE TABLE IF NOT EXISTS sellos (
  id TEXT PRIMARY KEY,
  tarjeta_id TEXT NOT NULL,
  comercio_id TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'cliente',
  stamped_at TEXT NOT NULL,
  UNIQUE (tarjeta_id, id)
);

CREATE INDEX IF NOT EXISTS idx_tarjetas_comercio ON tarjetas(comercio_id);
CREATE INDEX IF NOT EXISTS idx_sellos_tarjeta ON sellos(tarjeta_id);
CREATE INDEX IF NOT EXISTS idx_sellos_comercio ON sellos(comercio_id);
