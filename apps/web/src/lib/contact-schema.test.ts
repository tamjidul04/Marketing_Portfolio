import { test } from "node:test";
import assert from "node:assert/strict";
import { looksLikeBot, validateContact } from "./contact-schema.ts";

const ok = { name: "Jane", email: "jane@example.com" };

test("valid with email only", () => assert.equal(validateContact(ok).ok, true));
test("valid with phone only", () => assert.equal(validateContact({ name: "Jane", phone: "+1 555 000 0000" }).ok, true));

test("name is required", () => {
  const r = validateContact({ email: "a@b.co" });
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.name);
});
test("whitespace-only name rejected", () => assert.equal(validateContact({ name: "   ", email: "a@b.co" }).ok, false));
test("needs phone or email", () => {
  const r = validateContact({ name: "Jane" });
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.errors.phone);
});
test("bad email rejected", () => assert.equal(validateContact({ name: "J", email: "nope" }).ok, false));
test("bad phone rejected (letters)", () => assert.equal(validateContact({ name: "J", phone: "call me" }).ok, false));
test("name over 100 chars rejected", () => assert.equal(validateContact({ name: "x".repeat(101), email: "a@b.co" }).ok, false));
test("message over 5000 chars rejected", () => assert.equal(validateContact({ ...ok, message: "x".repeat(5001) }).ok, false));
test("values are trimmed", () => {
  const r = validateContact({ name: "  Jane  ", email: " jane@example.com " });
  assert.ok(r.ok && r.data.name === "Jane" && r.data.email === "jane@example.com");
});
test("null bytes are stripped", () => {
  const r = validateContact({ name: "Ja\u0000ne", email: "a@b.co" });
  assert.ok(r.ok && r.data.name === "Jane");
});

test("honeypot filled → bot", () => assert.equal(looksLikeBot("http://spam", "", 10_000), true));
test("empty honeypot → human", () => assert.equal(looksLikeBot("", String(Date.now() - 10_000), Date.now()), false));
test("instant submit → bot", () => assert.equal(looksLikeBot("", String(Date.now() - 500), Date.now()), true));
test("missing timer is not treated as a bot", () => assert.equal(looksLikeBot("", "", Date.now()), false));
