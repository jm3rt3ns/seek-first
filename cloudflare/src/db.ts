import type { User } from "./env.ts";
import { randomToken, sha256 } from "./util.ts";

const SESSION_DAYS = 30;

export async function upsertUser(db: D1Database, claims: { sub: string; email?: string; name?: string; picture?: string }): Promise<User> {
  const now = Date.now();
  const existing = await db.prepare("SELECT id, email, name, picture FROM users WHERE google_sub = ?").bind(claims.sub).first<User>();
  if (existing) {
    await db
      .prepare("UPDATE users SET email = ?, name = ?, picture = ?, last_login = ? WHERE id = ?")
      .bind(claims.email ?? existing.email, claims.name ?? existing.name, claims.picture ?? existing.picture, now, existing.id)
      .run();
    return { id: existing.id, email: claims.email ?? existing.email, name: claims.name ?? existing.name, picture: claims.picture ?? existing.picture };
  }
  const id = randomToken(16);
  await db
    .prepare("INSERT INTO users (id, google_sub, email, name, picture, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, claims.sub, claims.email ?? null, claims.name ?? null, claims.picture ?? null, now, now)
    .run();
  return { id, email: claims.email ?? null, name: claims.name ?? null, picture: claims.picture ?? null };
}

/** Creates a session and returns the raw token (only its hash is stored). */
export async function createSession(db: D1Database, userId: string): Promise<{ token: string; maxAge: number }> {
  const token = randomToken(32);
  const now = Date.now();
  const maxAge = SESSION_DAYS * 86400;
  await db
    .prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256(token), userId, now, now + maxAge * 1000)
    .run();
  return { token, maxAge };
}

export async function userForSession(db: D1Database, token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const hash = await sha256(token);
  const row = await db
    .prepare(
      "SELECT u.id, u.email, u.name, u.picture, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?",
    )
    .bind(hash)
    .first<User & { expires_at: number }>();
  if (!row) return null;
  const now = Date.now();
  if (row.expires_at < now) {
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(hash).run();
    return null;
  }
  // Sliding expiry: extend once the session is more than a day old.
  if (row.expires_at - now < (SESSION_DAYS - 1) * 86400 * 1000) {
    await db.prepare("UPDATE sessions SET expires_at = ? WHERE token_hash = ?").bind(now + SESSION_DAYS * 86400 * 1000, hash).run();
  }
  return { id: row.id, email: row.email, name: row.name, picture: row.picture };
}

export async function deleteSession(db: D1Database, token: string | undefined): Promise<void> {
  if (!token) return;
  await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256(token)).run();
}

export async function getState(db: D1Database, userId: string): Promise<{ json: string; updated_at: number } | null> {
  return db.prepare("SELECT json, updated_at FROM state WHERE user_id = ?").bind(userId).first();
}

export async function putState(db: D1Database, userId: string, json: string, updatedAt: number): Promise<void> {
  await db
    .prepare(
      "INSERT INTO state (user_id, json, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at",
    )
    .bind(userId, json, updatedAt)
    .run();
}

export async function getJournal(db: D1Database, userId: string, date: string): Promise<string> {
  const row = await db.prepare("SELECT text FROM journal WHERE user_id = ? AND date = ?").bind(userId, date).first<{ text: string }>();
  return row?.text ?? "";
}

export async function putJournal(db: D1Database, userId: string, date: string, text: string): Promise<void> {
  if (!text.trim()) {
    await db.prepare("DELETE FROM journal WHERE user_id = ? AND date = ?").bind(userId, date).run();
    return;
  }
  await db
    .prepare(
      "INSERT INTO journal (user_id, date, text, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, date) DO UPDATE SET text = excluded.text, updated_at = excluded.updated_at",
    )
    .bind(userId, date, text, Date.now())
    .run();
}

export async function listJournal(db: D1Database, userId: string, limit = 120): Promise<{ date: string; text: string }[]> {
  const r = await db.prepare("SELECT date, text FROM journal WHERE user_id = ? ORDER BY date DESC LIMIT ?").bind(userId, limit).all<{ date: string; text: string }>();
  return r.results;
}

/** Increments today's usage counter; returns false once the cap is reached. */
export async function meter(db: D1Database, userId: string, day: string, cap: number): Promise<boolean> {
  const row = await db.prepare("SELECT n FROM usage WHERE user_id = ? AND day = ?").bind(userId, day).first<{ n: number }>();
  if ((row?.n ?? 0) >= cap) return false;
  await db
    .prepare("INSERT INTO usage (user_id, day, n) VALUES (?, ?, 1) ON CONFLICT(user_id, day) DO UPDATE SET n = n + 1")
    .bind(userId, day)
    .run();
  return true;
}

export async function deleteAccount(db: D1Database, userId: string): Promise<void> {
  await db.batch([
    db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId),
    db.prepare("DELETE FROM state WHERE user_id = ?").bind(userId),
    db.prepare("DELETE FROM journal WHERE user_id = ?").bind(userId),
    db.prepare("DELETE FROM usage WHERE user_id = ?").bind(userId),
    db.prepare("DELETE FROM users WHERE id = ?").bind(userId),
  ]);
}
