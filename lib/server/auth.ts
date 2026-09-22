import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db, id, now } from "./db";

/* Session auth: scrypt-hashed passwords, opaque session ids in an httpOnly
   cookie, sessions stored server-side so they can be revoked.
 *
 * What this deliberately does NOT do, and would need before production:
 * email verification, password reset, rate limiting and lockout, MFA,
 * and rotating the session id on privilege change. Those are listed in
 * docs/TECHNICAL-PLAN.md rather than stubbed here. */

const COOKIE = "bontraco_session";
const SESSION_DAYS = 14;
const SCRYPT_N = 16384, SCRYPT_r = 8, SCRYPT_p = 1, KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, KEYLEN, {
    N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_r}$${SCRYPT_p}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, N, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const derived = crypto.scryptSync(password, salt, expected.length, {
    N: Number(N), r: Number(r), p: Number(p),
  });
  // Constant-time: a length mismatch would make timingSafeEqual throw.
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export interface SessionContext {
  userId: string;
  orgId: string;
  email: string;
  name: string;
  initials: string;
  role: string;
}

export async function createSession(userId: string, orgId: string) {
  const sid = id("sess");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  db().prepare(
    `INSERT INTO sessions (id, user_id, org_id, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(sid, userId, orgId, expires.toISOString(), now());

  const jar = await cookies();
  jar.set(COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return sid;
}

export async function destroySession() {
  const jar = await cookies();
  const sid = jar.get(COOKIE)?.value;
  if (sid) db().prepare(`DELETE FROM sessions WHERE id = ?`).run(sid);
  jar.delete(COOKIE);
}

/** Returns the caller's session, or null. Expired rows are deleted on read. */
export async function getSession(): Promise<SessionContext | null> {
  const jar = await cookies();
  const sid = jar.get(COOKIE)?.value;
  if (!sid) return null;

  const row = db().prepare(
    `SELECT s.id AS sid, s.expires_at, u.id AS user_id, u.org_id, u.email, u.name,
            u.initials, u.role
       FROM sessions s
       JOIN users u ON u.id = s.user_id
      WHERE s.id = ?`,
  ).get(sid) as
    | { sid: string; expires_at: string; user_id: string; org_id: string;
        email: string; name: string; initials: string; role: string }
    | undefined;

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db().prepare(`DELETE FROM sessions WHERE id = ?`).run(row.sid);
    return null;
  }
  return {
    userId: row.user_id, orgId: row.org_id, email: row.email,
    name: row.name, initials: row.initials, role: row.role,
  };
}

/** For route handlers and server components that must have a caller. */
export async function requireSession(): Promise<SessionContext> {
  const s = await getSession();
  if (!s) throw new UnauthorizedError();
  return s;
}

export class UnauthorizedError extends Error {
  constructor() { super("Not authenticated"); this.name = "UnauthorizedError"; }
}

export function audit(
  orgId: string, userId: string | null, action: string,
  subjectType = "", subjectId = "", meta: Record<string, unknown> = {},
) {
  db().prepare(
    `INSERT INTO audit_log (id, org_id, user_id, action, subject_type, subject_id, meta, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id("aud"), orgId, userId, action, subjectType, subjectId, JSON.stringify(meta), now());
}
