import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/* Local-disk object storage, partitioned by org.
 *
 * The interface is deliberately the small subset S3 also provides (put, get,
 * delete by key) so swapping in S3/R2 is a change to this file alone. Keys are
 * derived from the content hash, never from the user-supplied filename — an
 * upload called "../../etc/passwd" cannot escape the org's directory. */

const ROOT = process.env.BONTRACO_DATA_DIR ?? path.join(process.cwd(), "storage");
const BLOBS = path.join(ROOT, "blobs");

export interface StoredBlob {
  key: string;
  sha256: string;
  bytes: number;
}

export async function putBlob(orgId: string, data: Uint8Array): Promise<StoredBlob> {
  const sha256 = crypto.createHash("sha256").update(data).digest("hex");
  const key = `${safeSegment(orgId)}/${sha256.slice(0, 2)}/${sha256}`;
  const full = path.join(BLOBS, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, data);
  return { key, sha256, bytes: data.byteLength };
}

export async function getBlob(key: string): Promise<Buffer> {
  const full = path.join(BLOBS, key);
  const resolved = path.resolve(full);
  if (!resolved.startsWith(path.resolve(BLOBS) + path.sep)) {
    throw new Error("Blob key escapes the storage root");
  }
  return fs.readFile(resolved);
}

export async function deleteBlob(key: string): Promise<void> {
  const full = path.resolve(path.join(BLOBS, key));
  if (!full.startsWith(path.resolve(BLOBS) + path.sep)) return;
  await fs.rm(full, { force: true });
}

function safeSegment(s: string) {
  return s.replace(/[^A-Za-z0-9_-]/g, "");
}
