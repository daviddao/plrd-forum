import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test, { type TestContext } from "node:test";
import { getSessionSecret } from "../src/lib/auth/secret";

function restoreSecret(t: TestContext) {
  const original = process.env.SESSION_SECRET;
  t.after(() => {
    if (original === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = original;
  });
}

test("missing session secret fails closed", (t) => {
  restoreSecret(t);
  delete process.env.SESSION_SECRET;
  assert.throws(getSessionSecret, /Set SESSION_SECRET/);
});

test("short session secrets are rejected", (t) => {
  restoreSecret(t);
  process.env.SESSION_SECRET = randomBytes(8).toString("hex");
  assert.throws(getSessionSecret, /at least 32 characters/);
});

test("a configured session secret is used unchanged", (t) => {
  restoreSecret(t);
  const secret = randomBytes(32).toString("hex");
  process.env.SESSION_SECRET = secret;
  assert.equal(getSessionSecret(), secret);
});
