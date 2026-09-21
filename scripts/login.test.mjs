import assert from "node:assert/strict";
import test from "node:test";

const base = process.env.LOGIN_TEST_BASE_URL;
if (!base) throw new Error("Set LOGIN_TEST_BASE_URL to a running forum instance.");

const post = (fields) => fetch(new URL("/oauth/login", base), {
  method: "POST",
  body: new URLSearchParams(fields),
  redirect: "manual",
});

// Never follow the authorization redirect in these tests. ePDS's browser
// JavaScript can send an OTP automatically when it receives a login hint.

test("email is primary and handle login is collapsed", async () => {
  const response = await fetch(new URL("/login", base));
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /type="email"/);
  assert(html.indexOf('name="email"') < html.indexOf('name="handle"'));
  assert.match(html, /<details class="login-alternative">/);
  assert.match(html, /Use an ATProto handle instead/);
});

test("invalid email stays on the forum without echoing the input", async () => {
  for (const email of ["", "invalid", "two@@example.com", "name @example.com"]) {
    const response = await post({ method: "email", email });
    assert.equal(response.status, 303);
    const location = new URL(response.headers.get("location"));
    assert.equal(location.pathname, "/login");
    assert.equal(location.search, "?error=email");
  }
});

test("email errors are accessible", async () => {
  const html = await (await fetch(new URL("/login?error=email", base))).text();
  assert.match(html, /role="alert"/);
  assert.match(html, /Please enter a valid email address/);
  assert.match(html, /aria-invalid="true"/);
});

test("unknown error codes do not break the login page", async () => {
  const response = await fetch(new URL("/login?error=constructor", base));
  assert.equal(response.status, 200);
  assert.match(await response.text(), /type="email"/);
});

test("email initiates ePDS OAuth with a fresh sign-in and state cookie", async () => {
  const response = await post({ method: "email", email: "  login-check@example.com  " });
  assert.equal(response.status, 303);
  const location = new URL(response.headers.get("location"));
  assert.equal(location.protocol, "https:");
  assert(location.searchParams.has("client_id"));
  assert(location.searchParams.has("request_uri"));
  assert.equal(location.searchParams.get("login_hint"), "login-check@example.com");
  assert.equal(location.searchParams.get("prompt"), "login");
  assert(response.headers.has("set-cookie"));
});

test("missing handles show the expanded alternative", async () => {
  const response = await post({ method: "handle", handle: " " });
  assert.equal(response.status, 303);
  const location = new URL(response.headers.get("location"));
  assert.equal(location.searchParams.get("error"), "missing");
  const html = await (await fetch(location)).text();
  assert.match(html, /<details class="login-alternative" open="">/);
  assert.match(html, /Please enter your ATProto handle/);
});

test("explicit and legacy handle forms both initiate OAuth", async () => {
  for (const fields of [{ method: "handle", handle: " @plrd.org " }, { handle: "plrd.org" }]) {
    const response = await post(fields);
    assert.equal(response.status, 303);
    const location = new URL(response.headers.get("location"));
    assert.equal(location.protocol, "https:");
    assert(location.searchParams.has("client_id"));
    assert(location.searchParams.has("request_uri"));
    assert(response.headers.has("set-cookie"));
  }
});
