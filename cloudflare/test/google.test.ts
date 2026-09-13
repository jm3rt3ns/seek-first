import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyGoogleIdToken, googleAuthUrl } from "../src/google.ts";
import { b64url } from "../src/util.ts";

async function makeKeyAndToken(claims: Record<string, unknown>, kid = "k1") {
  const pair = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
  const jwk = (await crypto.subtle.exportKey("jwk", pair.publicKey)) as JsonWebKey;
  const enc = new TextEncoder();
  const head = b64url(enc.encode(JSON.stringify({ alg: "RS256", kid, typ: "JWT" })));
  const body = b64url(enc.encode(JSON.stringify(claims)));
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, enc.encode(`${head}.${body}`));
  const token = `${head}.${body}.${b64url(sig)}`;
  const jwks = async () => ({ keys: [{ kid, kty: "RSA", n: jwk.n!, e: jwk.e! }] });
  return { token, jwks };
}

const now = 1_800_000_000_000;
const base = { iss: "https://accounts.google.com", sub: "123", aud: "client-id", exp: now / 1000 + 600, iat: now / 1000, email: "a@b.c", nonce: "n1" };

test("accepts a valid token", async () => {
  const { token, jwks } = await makeKeyAndToken(base);
  const claims = await verifyGoogleIdToken(token, "client-id", { jwks, now, nonce: "n1" });
  assert.equal(claims.sub, "123");
});

test("rejects wrong audience, expiry, issuer, nonce, and signature", async () => {
  for (const [patch, msg] of [
    [{ aud: "other" }, /audience/],
    [{ exp: now / 1000 - 600 }, /expired/],
    [{ iss: "https://evil.example" }, /issuer/],
    [{ nonce: "n2" }, /nonce/],
  ] as const) {
    const { token, jwks } = await makeKeyAndToken({ ...base, ...patch });
    await assert.rejects(verifyGoogleIdToken(token, "client-id", { jwks, now, nonce: "n1" }), msg);
  }
  const a = await makeKeyAndToken(base);
  const b = await makeKeyAndToken(base); // different key, same kid
  await assert.rejects(verifyGoogleIdToken(a.token, "client-id", { jwks: b.jwks, now, nonce: "n1" }), /signature/);
});

test("auth url carries PKCE and state", () => {
  const u = new URL(googleAuthUrl({ clientId: "c", redirectUri: "https://x/cb", state: "s", nonce: "n", codeChallenge: "ch" }));
  assert.equal(u.searchParams.get("code_challenge_method"), "S256");
  assert.equal(u.searchParams.get("state"), "s");
  assert.equal(u.searchParams.get("scope"), "openid email profile");
});
