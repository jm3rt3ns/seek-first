import { b64urlDecode } from "./util.ts";

export interface GoogleIdClaims {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  nonce?: string;
}

interface Jwk {
  kid: string;
  kty: string;
  alg?: string;
  n: string;
  e: string;
}

export type JwksFetcher = () => Promise<{ keys: Jwk[] }>;

const GOOGLE_JWKS = "https://www.googleapis.com/oauth2/v3/certs";
let cachedKeys: { keys: Jwk[]; fetchedAt: number } | null = null;

export const fetchGoogleJwks: JwksFetcher = async () => {
  if (cachedKeys && Date.now() - cachedKeys.fetchedAt < 6 * 3600_000) return cachedKeys;
  const r = await fetch(GOOGLE_JWKS, { cf: { cacheTtl: 3600 } } as RequestInit);
  if (!r.ok) throw new Error("jwks fetch failed");
  const body = (await r.json()) as { keys: Jwk[] };
  cachedKeys = { keys: body.keys, fetchedAt: Date.now() };
  return cachedKeys;
};

/**
 * Verify a Google-issued ID token: RS256 signature against Google's JWKS,
 * issuer, audience, expiry, and (optionally) the nonce we sent.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  clientId: string,
  opts: { jwks?: JwksFetcher; now?: number; nonce?: string } = {},
): Promise<GoogleIdClaims> {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("malformed id_token");
  const header = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0]))) as { alg: string; kid: string };
  if (header.alg !== "RS256") throw new Error("unexpected alg");
  const { keys } = await (opts.jwks ?? fetchGoogleJwks)();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("unknown key id");
  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlDecode(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!ok) throw new Error("bad signature");
  const claims = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1]))) as GoogleIdClaims;
  const now = Math.floor((opts.now ?? Date.now()) / 1000);
  if (claims.iss !== "https://accounts.google.com" && claims.iss !== "accounts.google.com") throw new Error("bad issuer");
  if (claims.aud !== clientId) throw new Error("bad audience");
  if (typeof claims.exp !== "number" || claims.exp < now - 60) throw new Error("expired");
  if (opts.nonce !== undefined && claims.nonce !== opts.nonce) throw new Error("nonce mismatch");
  if (!claims.sub) throw new Error("no subject");
  return claims;
}

export function googleAuthUrl(p: { clientId: string; redirectUri: string; state: string; nonce: string; codeChallenge: string }): string {
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", p.clientId);
  u.searchParams.set("redirect_uri", p.redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid email profile");
  u.searchParams.set("state", p.state);
  u.searchParams.set("nonce", p.nonce);
  u.searchParams.set("code_challenge", p.codeChallenge);
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("prompt", "select_account");
  return u.toString();
}

export async function exchangeCode(p: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<{ id_token: string }> {
  const body = new URLSearchParams({
    code: p.code,
    client_id: p.clientId,
    client_secret: p.clientSecret,
    redirect_uri: p.redirectUri,
    grant_type: "authorization_code",
    code_verifier: p.codeVerifier,
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error(`token exchange failed (${r.status})`);
  const data = (await r.json()) as { id_token?: string };
  if (!data.id_token) throw new Error("no id_token in token response");
  return { id_token: data.id_token };
}
