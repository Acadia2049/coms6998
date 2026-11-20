require("./register.cjs");
const assert = require("node:assert/strict");
const test = require("node:test");
const Module = require("node:module");
let exchangeError = null;
const exchanged = [];
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === "@/lib/supabase/server") return {
    createClient: async () => ({ auth: { exchangeCodeForSession: async code => {
      exchanged.push(code);
      return { error: exchangeError };
    } } }),
  };
  return originalLoad.call(this, name, ...args);
};
const { GET } = require("../app/auth/callback/route.ts");
Module._load = originalLoad;
const origin = "https://writing.example";

function request(next, code = "synthetic-code") {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", next);
  if (code) url.searchParams.set("code", code);
  return new Request(url);
}

test("successful exchange returns the writer to their local destination", async () => {
  const response = await GET(request("/write?draft=1#editor"));
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), `${origin}/write?draft=1#editor`);
  assert.equal(exchanged.at(-1), "synthetic-code");
});

test("successful exchange cannot redirect to an external authority", async () => {
  for (const next of ["//outside.example", "/\\outside.example", "/a/..//outside.example", "/.%2e//outside.example"]) {
    const response = await GET(request(next));
    assert.equal(response.headers.get("location"), `${origin}/`, next);
  }
});

test("missing code returns a local error without exchanging a session", async () => {
  const before = exchanged.length;
  const response = await GET(request("//outside.example", null));
  assert.equal(exchanged.length, before);
  assert.equal(response.headers.get("location"), `${origin}/?auth_error=missing_code`);
});

test("failed exchange returns a local error without honoring next", async () => {
  exchangeError = { message: "simulated invalid code" };
  try {
    const response = await GET(request("//outside.example"));
    assert.equal(response.headers.get("location"), `${origin}/?auth_error=callback_failed`);
  } finally {
    exchangeError = null;
  }
});
