import { test } from "node:test";
import assert from "node:assert/strict";
import { darken, readableOn } from "./format.ts";

test("emerald accent gets dark text (white would be hard to read)", () => assert.equal(readableOn("#10B981"), "#1B2A4A"));
test("gold accent gets dark text", () => assert.equal(readableOn("#E0A526"), "#1B2A4A"));
test("navy gets white text", () => assert.equal(readableOn("#1B2A4A"), "#FFFFFF"));
test("white gets dark text, black gets white text", () => {
  assert.equal(readableOn("#FFFFFF"), "#1B2A4A");
  assert.equal(readableOn("#000000"), "#FFFFFF");
});
test("deep blue and dark green get white text", () => {
  assert.equal(readableOn("#2563EB"), "#FFFFFF");
  assert.equal(readableOn("#1F5248"), "#FFFFFF");
});
test("darken keeps a valid hex colour", () => assert.match(darken("#10B981"), /^#[0-9a-f]{6}$/));
