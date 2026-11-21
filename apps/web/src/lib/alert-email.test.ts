import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAlertEmail, escapeHtml, oneLine, parseRecipients, whatsappLink } from "./alert-email.ts";

const ID = "3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b";
const opts = { from: "Site <onboarding@resend.dev>", to: ["owner@example.com"], adminUrl: "https://admin.example.com/" };

test("escapeHtml: neutralises tags, quotes and ampersands", () => {
  assert.equal(escapeHtml(`<img src=x onerror="alert('1')">&`), "&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt;&amp;");
});

test("oneLine: strips line breaks (no header injection) and shortens", () => {
  const LS = String.fromCharCode(0x2028);
  assert.equal(oneLine("Jane\r\nBcc: evil@x.co", 100), "Jane Bcc: evil@x.co");
  assert.equal(oneLine(`a${LS}b\u0000c`, 100), "a b c");
  assert.equal(oneLine("abcdefghij", 5), "abcd…");
});

test("parseRecipients: keeps valid addresses only, max 3", () => {
  assert.deepEqual(parseRecipients(" a@x.co, nope , b@y.org;c@z.io,d@w.net"), ["a@x.co", "b@y.org", "c@z.io"]);
  assert.deepEqual(parseRecipients(undefined), []);
  assert.deepEqual(parseRecipients("you@example.com\nBcc: x@y.co"), []);
});

test("whatsappLink: digits only, sensible length", () => {
  assert.equal(whatsappLink("+880 1712-345678"), "https://wa.me/8801712345678");
  assert.equal(whatsappLink("123"), null);
  assert.equal(whatsappLink(undefined), null);
});

test("buildAlertEmail: subject, inbox link, reply-to", () => {
  const m = buildAlertEmail({ id: ID, name: "Jane Doe", business: "Acme", email: "jane@acme.co", phone: "+1 555 000 0000", service: "Meta Ads", budget: "$500", message: "Hello\nthere", sourcePath: "/work/x" }, opts);
  assert.equal(m.subject, "New enquiry from Jane Doe (Acme)");
  assert.equal(m.reply_to, "jane@acme.co");
  assert.deepEqual(m.to, ["owner@example.com"]);
  assert.ok(m.html.includes(`https://admin.example.com/inbox/${ID}`));
  assert.ok(m.text.includes(`Open in your inbox: https://admin.example.com/inbox/${ID}`));
  assert.ok(m.html.includes("https://wa.me/15550000000"));
  assert.ok(m.text.includes("Hello\nthere"));
  assert.ok(m.text.includes("Budget: $500"));
});

test("buildAlertEmail: visitor input cannot inject HTML or headers", () => {
  const m = buildAlertEmail({ id: ID, name: "Eve\r\nBcc: a@b.co", email: "eve@x.co", message: "<script>alert(1)</script><a href='javascript:x'>hi</a>" }, opts);
  assert.ok(!/[\r\n]/.test(m.subject));
  assert.ok(!m.html.includes("<script>"));
  assert.ok(!m.html.includes("<a href='javascript"));
  assert.ok(m.html.includes("&lt;script&gt;"));
});

test("buildAlertEmail: no reply-to or WhatsApp when not given; bad id falls back to the inbox", () => {
  const m = buildAlertEmail({ id: "../../evil", name: "Sam", phone: "12", message: "" }, opts);
  assert.equal(m.reply_to, undefined);
  assert.ok(!m.html.includes("wa.me"));
  assert.ok(m.html.includes('href="https://admin.example.com/inbox"'));
  assert.ok(!m.html.includes("evil"));
  assert.ok(m.text.includes("(no message)"));
});

test("buildAlertEmail: an invalid visitor email is not used as reply-to", () => {
  const m = buildAlertEmail({ id: ID, name: "Sam", email: "a@b.co, x@y.co" }, opts);
  assert.equal(m.reply_to, undefined);
});
