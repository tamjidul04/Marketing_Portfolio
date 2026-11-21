import { test } from "node:test";
import assert from "node:assert/strict";
import { analyticsSnippet, isGa4Id, isPixelId, jsonLdString } from "./seo.ts";

test("JSON-LD: '<' is escaped so text cannot close the script tag", () => {
  const s = jsonLdString({ name: "</script><script>alert(1)</script>" });
  assert.ok(!s.includes("<"));
  assert.deepEqual(JSON.parse(s), { name: "</script><script>alert(1)</script>" }); // still round-trips
});
test("JSON-LD: line separators are escaped", () => assert.ok(!jsonLdString({ a: "x y z" }).includes(" ")));

test("pixel id format", () => {
  assert.equal(isPixelId("1234567890123456"), true);
  assert.equal(isPixelId("123"), false);
  assert.equal(isPixelId("12345678'); alert(1);//"), false);
  assert.equal(isPixelId(null), false);
});
test("ga4 id format", () => {
  assert.equal(isGa4Id("G-ABC123XYZ9"), true);
  assert.equal(isGa4Id("UA-12345-1"), false);
  assert.equal(isGa4Id("G-ABCD');alert(1);//"), false);
  assert.equal(isGa4Id(undefined), false);
});

test("no valid ids → no script at all", () => {
  assert.equal(analyticsSnippet(null, null), null);
  assert.equal(analyticsSnippet("bad", "bad"), null);
});
test("pixel only", () => {
  const s = analyticsSnippet("1234567890123456", null)!;
  assert.ok(s.includes("fbq('init','1234567890123456')") && !s.includes("googletagmanager"));
});
test("ga4 only", () => {
  const s = analyticsSnippet(null, "G-ABC123XYZ9")!;
  assert.ok(s.includes("gtag('config','G-ABC123XYZ9'") && !s.includes("fbq("));
});
test("both ids, and Do Not Track is honoured", () => {
  const s = analyticsSnippet("1234567890123456", "G-ABC123XYZ9")!;
  assert.ok(s.includes("fbq('init'") && s.includes("gtag('config'"));
  assert.ok(s.startsWith("(function(){if(navigator.doNotTrack==='1'"));
});
test("an invalid id is dropped while a valid one still loads", () => {
  const s = analyticsSnippet("bad'; evil()", "G-ABC123XYZ9")!;
  assert.ok(!s.includes("evil") && s.includes("gtag('config'"));
});
