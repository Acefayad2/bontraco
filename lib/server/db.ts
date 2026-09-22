import "server-only";
import pg from "pg";
import crypto from "node:crypto";

/* Postgres, via Supabase.
 *
 * The rest of the server code speaks the four verbs below rather than a
 * driver API, so the queries in repo.ts are plain parameterised SQL and
 * nothing above this file knows which database is underneath.
 *
 * Queries are written with `?` placeholders — the same style the SQLite
 * version used — and rewritten to Postgres's $1/$2 here. That keeps the SQL
 * diff-free across the migration, which is where a port like this usually
 * introduces bugs. */

const POOL_SIZE = 10;

/* pg hands back DATE and TIMESTAMPTZ columns as JavaScript Date objects. The
   whole app treats dates as ISO strings — it sorts them with localeCompare and
   slices them — so parse them back to strings at the driver boundary rather
   than defending against Date objects at every call site. TypeScript cannot
   catch this: the row types say `string` and the driver disagrees at runtime. */
const OID_DATE = 1082, OID_TIMESTAMP = 1114, OID_TIMESTAMPTZ = 1184;
pg.types.setTypeParser(OID_DATE, (v) => v);                       // 'YYYY-MM-DD'
pg.types.setTypeParser(OID_TIMESTAMP, (v) => new Date(v + "Z").toISOString());
pg.types.setTypeParser(OID_TIMESTAMPTZ, (v) => new Date(v).toISOString());

let _pool: pg.Pool | null = null;

function pool(): pg.Pool {
  if (_pool) return _pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill in the " +
      "Supabase connection string.",
    );
  }
  _pool = new pg.Pool({
    connectionString,
    max: POOL_SIZE,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // Supabase terminates TLS at the pooler with its own chain.
    ssl: { rejectUnauthorized: false },
  });
  _pool.on("error", (err) => console.error("[db] idle client error:", err));
  return _pool;
}

/** `?` → `$1, $2, …`, leaving `??` (Postgres JSON operator) alone. */
function toNumbered(sql: string): string {
  let n = 0;
  return sql.replace(/\?\??/g, (m) => (m === "??" ? m : `$${++n}`));
}

export async function many<T = Record<string, unknown>>(
  sql: string, params: unknown[] = [],
): Promise<T[]> {
  const res = await pool().query(toNumbered(sql), params);
  return res.rows as T[];
}

export async function one<T = Record<string, unknown>>(
  sql: string, params: unknown[] = [],
): Promise<T | undefined> {
  const rows = await many<T>(sql, params);
  return rows[0];
}

/** Returns the number of rows affected. */
export async function run(sql: string, params: unknown[] = []): Promise<number> {
  const res = await pool().query(toNumbered(sql), params);
  return res.rowCount ?? 0;
}

/** Runs `fn` inside a transaction on a single dedicated connection. */
export async function tx<T>(
  fn: (q: {
    many: typeof many; one: typeof one; run: typeof run;
  }) => Promise<T>,
): Promise<T> {
  const client = await pool().connect();
  const scoped = {
    many: async <R = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
      (await client.query(toNumbered(sql), params)).rows as R[],
    one: async <R = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
      ((await client.query(toNumbered(sql), params)).rows as R[])[0],
    run: async (sql: string, params: unknown[] = []) =>
      (await client.query(toNumbered(sql), params)).rowCount ?? 0,
  } as { many: typeof many; one: typeof one; run: typeof run };

  try {
    await client.query("BEGIN");
    const result = await fn(scoped);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export function id(prefix: string) {
  return `${prefix}_${crypto.randomBytes(9).toString("base64url")}`;
}

export function now() {
  return new Date().toISOString();
}

/** Postgres has real booleans; these remain so call sites read the same. */
export const bool = (v: boolean) => v;
export const unbool = (v: boolean | number | null | undefined) => v === true || v === 1;
