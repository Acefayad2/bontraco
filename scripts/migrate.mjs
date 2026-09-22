/* Applies db/schema.postgres.sql. Every statement is CREATE ... IF NOT EXISTS,
   so this is safe to re-run. Usage: npm run db:migrate */
import { readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL_DIRECT or DATABASE_URL must be set. See .env.example.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query(readFileSync("db/schema.postgres.sql", "utf8"));
const { rows } = await client.query(
  `select table_name from information_schema.tables
    where table_schema = 'public' order by table_name`,
);
console.log(`Applied. ${rows.length} tables: ${rows.map((r) => r.table_name).join(", ")}`);
await client.end();
