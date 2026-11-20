require("./register.cjs");
const assert = require("node:assert/strict");
const test = require("node:test");
const { safeReturnPath } = require("../lib/auth-return.ts");
const origin = "https://writing.example";

test("preserves local writing destinations, query strings and anchors", () => {
  for (const path of ["/", "/write", "/profile?tab=drafts#notice-2", "/write?text=hello%20world"]) {
    assert.equal(safeReturnPath(path), path);
    assert.equal(new URL(safeReturnPath(path), origin).origin, origin);
  }
});

test("rejects missing, absolute, protocol-relative and backslash destinations", () => {
  for (const path of [null, undefined, "", "write", "https://outside.example", "//outside.example", "/\\outside.example", "/a\\b", "javascript:alert(1)"]) {
    assert.equal(safeReturnPath(path), "/", JSON.stringify(path));
  }
});

test("rejects whitespace and control characters that URL parsers normalize", () => {
  for (const path of ["/ write", "/\t/outside.example", "/\n/outside.example", "/\r/outside.example", "/\u0000x", "/\u007fx"]) {
    assert.equal(safeReturnPath(path), "/", JSON.stringify(path));
  }
});

test("keeps normalized dot segments from becoming a new authority", () => {
  for (const path of ["/a/..//outside.example", "/.%2e//outside.example", "/a/%2e%2e//outside.example"]) {
    assert.equal(safeReturnPath(path), "/", path);
  }
  assert.equal(safeReturnPath("/account/../write?from=login"), "/write?from=login");
});

test("remains same-origin after callback query decoding and final URL resolution", () => {
  for (const encoded of ["%2F%2Foutside.example", "%2F%5Coutside.example", "%2Fa%2F..%2F%2Foutside.example", "%2F%252Foutside.example", "%2Fwrite%3Fnext%3Dhttps%3A%2F%2Foutside.example"]) {
    const callback = new URL(`${origin}/auth/callback?next=${encoded}`);
    assert.equal(new URL(safeReturnPath(callback.searchParams.get("next")), origin).origin, origin);
  }
});
