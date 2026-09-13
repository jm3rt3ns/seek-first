import type { Env, User } from "./env.ts";
import { createSession, deleteAccount, deleteSession, getJournal, getState, listJournal, meter, putJournal, putState, upsertUser, userForSession } from "./db.ts";
import { exchangeCode, googleAuthUrl, verifyGoogleIdToken } from "./google.ts";
import { parsePrayerNote, type ExistingRequest } from "./prayer.ts";
import { HttpError, cookie, dayKey, json, parseCookies, randomToken, safeEqual, sha256 } from "./util.ts";

const SESSION_COOKIE = "sf_session";
const OAUTH_COOKIE = "sf_oauth";
const STATE_MAX_BYTES = 256 * 1024;
const JOURNAL_MAX_BYTES = 64 * 1024;
const PARSE_MAX_CHARS = 600;
const PARSE_PER_DAY = 150;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return withSecurityHeaders(await api(request, url, env, ctx), false);
      return withSecurityHeaders(await serveAsset(request, url, env), url.pathname === "/" || url.pathname === "/index.html");
    } catch (e) {
      if (e instanceof HttpError) return withSecurityHeaders(json({ error: e.message }, { status: e.status }), false);
      console.error(e);
      return withSecurityHeaders(json({ error: "internal error" }, { status: 500 }), false);
    }
  },
} satisfies ExportedHandler<Env>;

/* ---------- static assets, with a per-response CSP nonce on the page ---------- */
async function serveAsset(request: Request, url: URL, env: Env): Promise<Response> {
  const isPage = url.pathname === "/" || url.pathname === "/index.html";
  if (!isPage) {
    if (url.pathname === "/README.md") return new Response("Not found", { status: 404 });
    return env.ASSETS.fetch(request);
  }
  const res = await env.ASSETS.fetch(new Request(new URL("/index.html", url.origin), request));
  if (!res.ok) return res;
  const nonce = randomToken(16);
  const html = (await res.text()).replace(/<script(?![^>]*\btype="application\/json")/g, `<script nonce="${nonce}"`);
  const headers = new Headers(res.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "no-cache");
  headers.set(
    "content-security-policy",
    [
      "default-src 'self'",
      `script-src 'nonce-${nonce}' https://cdnjs.cloudflare.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src https://fonts.gstatic.com",
      "img-src 'self' data: https://lh3.googleusercontent.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  );
  return new Response(html, { status: res.status, headers });
}

function withSecurityHeaders(res: Response, isPage: boolean): Response {
  const h = new Headers(res.headers);
  h.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  h.set("x-content-type-options", "nosniff");
  h.set("referrer-policy", "strict-origin-when-cross-origin");
  h.set("x-frame-options", "DENY");
  h.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  if (!isPage && !h.has("cache-control")) h.set("cache-control", "public, max-age=3600");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

/* ---------- API ---------- */
async function api(request: Request, url: URL, env: Env, ctx: ExecutionContext): Promise<Response> {
  const path = url.pathname;
  const method = request.method;
  const cookies = parseCookies(request.headers.get("cookie"));

  if (path === "/api/auth/login" && method === "GET") return login(url, env);
  if (path === "/api/auth/callback" && method === "GET") return callback(url, env, cookies);

  if (method !== "GET") requireSameOrigin(request, env);

  if (path === "/api/auth/logout" && method === "POST") {
    await deleteSession(env.DB, cookies[SESSION_COOKIE]);
    return json({ ok: true }, { headers: { "set-cookie": cookie(SESSION_COOKIE, "", { maxAge: 0 }) } });
  }

  const user = await userForSession(env.DB, cookies[SESSION_COOKIE]);
  if (path === "/api/me" && method === "GET") return json({ user });
  if (!user) throw new HttpError(401, "sign in required");

  if (path === "/api/state") {
    if (method === "GET") {
      const row = await getState(env.DB, user.id);
      return json({ state: row ? JSON.parse(row.json) : null, updatedAt: row?.updated_at ?? 0 });
    }
    if (method === "PUT") {
      const body = await readJson(request, STATE_MAX_BYTES);
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new HttpError(400, "state must be an object");
      const updatedAt = typeof (body as { updatedAt?: unknown }).updatedAt === "number" ? (body as { updatedAt: number }).updatedAt : Date.now();
      const current = await getState(env.DB, user.id);
      if (current && current.updated_at > updatedAt) {
        // A newer copy exists (another device). Hand it back instead of overwriting.
        return json({ ok: false, conflict: true, state: JSON.parse(current.json), updatedAt: current.updated_at }, { status: 409 });
      }
      await putState(env.DB, user.id, JSON.stringify(body), updatedAt);
      return json({ ok: true, updatedAt });
    }
  }

  const journalMatch = path.match(/^\/api\/journal(?:\/(\d{4}-\d{2}-\d{2}))?$/);
  if (journalMatch) {
    const date = journalMatch[1];
    if (method === "GET" && !date) return json({ entries: await listJournal(env.DB, user.id) });
    if (method === "GET" && date) return json({ date, text: await getJournal(env.DB, user.id, date) });
    if (method === "PUT" && date) {
      const body = (await readJson(request, JOURNAL_MAX_BYTES)) as { text?: unknown } | null;
      if (!body || typeof body.text !== "string") throw new HttpError(400, "text required");
      await putJournal(env.DB, user.id, date, body.text);
      return json({ ok: true });
    }
  }

  if (path === "/api/prayer/parse" && method === "POST") {
    const body = (await readJson(request, 32 * 1024)) as { text?: unknown; existing?: unknown } | null;
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) throw new HttpError(400, "text required");
    if (text.length > PARSE_MAX_CHARS) throw new HttpError(413, `keep it under ${PARSE_MAX_CHARS} characters`);
    const existing: ExistingRequest[] = Array.isArray(body?.existing)
      ? (body!.existing as unknown[])
          .filter((e): e is ExistingRequest => !!e && typeof e === "object" && typeof (e as ExistingRequest).id === "string" && typeof (e as ExistingRequest).who === "string")
          .slice(0, 200)
          .map((e) => ({ id: e.id.slice(0, 32), who: e.who.slice(0, 80), what: typeof e.what === "string" ? e.what.slice(0, 200) : undefined }))
      : [];
    if (!(await meter(env.DB, user.id, dayKey(), PARSE_PER_DAY))) throw new HttpError(429, "daily limit reached — use the form for now");
    if (!env.ANTHROPIC_API_KEY) throw new HttpError(503, "parser not configured");
    const result = await parsePrayerNote(env.ANTHROPIC_API_KEY, localDay(request), existing, text);
    return json(result);
  }

  if (path === "/api/account" && method === "DELETE") {
    await deleteAccount(env.DB, user.id);
    return json({ ok: true }, { headers: { "set-cookie": cookie(SESSION_COOKIE, "", { maxAge: 0 }) } });
  }

  throw new HttpError(404, "not found");
}

/* ---------- Google sign-in (authorization code + PKCE, server-side) ---------- */
async function login(url: URL, env: Env): Promise<Response> {
  const state = randomToken(24);
  const nonce = randomToken(24);
  const verifier = randomToken(48);
  const challenge = await sha256(verifier);
  const redirectUri = `${env.APP_ORIGIN}/api/auth/callback`;
  const to = googleAuthUrl({ clientId: env.GOOGLE_CLIENT_ID, redirectUri, state, nonce, codeChallenge: challenge });
  const returnTo = url.searchParams.get("return") ?? "/";
  const payload = JSON.stringify({ state, nonce, verifier, returnTo: returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/" });
  return new Response(null, {
    status: 302,
    headers: { location: to, "set-cookie": cookie(OAUTH_COOKIE, payload, { maxAge: 600, path: "/api/auth" }) },
  });
}

async function callback(url: URL, env: Env, cookies: Record<string, string>): Promise<Response> {
  const raw = cookies[OAUTH_COOKIE];
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!raw || !code || !state) throw new HttpError(400, "sign-in did not complete — please try again");
  let saved: { state: string; nonce: string; verifier: string; returnTo: string };
  try {
    saved = JSON.parse(raw);
  } catch {
    throw new HttpError(400, "sign-in did not complete — please try again");
  }
  if (!(await safeEqual(saved.state, state))) throw new HttpError(400, "sign-in state mismatch");
  const { id_token } = await exchangeCode({
    code,
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${env.APP_ORIGIN}/api/auth/callback`,
    codeVerifier: saved.verifier,
  });
  const claims = await verifyGoogleIdToken(id_token, env.GOOGLE_CLIENT_ID, { nonce: saved.nonce });
  if (claims.email && claims.email_verified === false) throw new HttpError(403, "Google account email is not verified");
  const user = await upsertUser(env.DB, claims);
  const session = await createSession(env.DB, user.id);
  const headers = new Headers({ location: `${env.APP_ORIGIN}${saved.returnTo || "/"}` });
  headers.append("set-cookie", cookie(SESSION_COOKIE, session.token, { maxAge: session.maxAge }));
  headers.append("set-cookie", cookie(OAUTH_COOKIE, "", { maxAge: 0, path: "/api/auth" }));
  return new Response(null, { status: 302, headers });
}

/* ---------- helpers ---------- */
function requireSameOrigin(request: Request, env: Env): void {
  // Sessions ride a SameSite=Lax cookie, which already blocks cross-site POSTs in modern browsers;
  // this makes the check explicit and covers older clients.
  const origin = request.headers.get("origin");
  if (origin && origin !== env.APP_ORIGIN) throw new HttpError(403, "cross-origin request refused");
  if (request.headers.get("x-requested-with") !== "SeekFirst") throw new HttpError(403, "missing request header");
}

async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  const len = Number(request.headers.get("content-length") ?? 0);
  if (len > maxBytes) throw new HttpError(413, "payload too large");
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, "payload too large");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "invalid JSON");
  }
}

/** The client's local calendar day, sent as a header so "this week" resolves in the user's timezone. */
function localDay(request: Request): string {
  const d = request.headers.get("x-local-date");
  return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : dayKey();
}

export type { User };
