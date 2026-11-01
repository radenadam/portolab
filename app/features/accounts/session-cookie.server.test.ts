import { expect, test } from "vitest";
import {
  expiredSessionCookieHeader,
  readSessionToken,
  sessionCookieHeader,
  setsSessionCookie,
} from "./session-cookie.server";
import type { SessionToken } from "./session-store.server";

const token = `${"a".repeat(24)}.${"b".repeat(24)}` as SessionToken;
const secureRequest = new Request("https://portolab.example/account");
const plainRequest = new Request("http://192.168.1.5:3000/account");

test("keeps the session in a cookie that scripts cannot read, that stays on this site, and that lasts 14 days", async () => {
  const header = await sessionCookieHeader(plainRequest, token);
  expect(header).toMatch(/^portolab_session=[^;]+; /);
  expect(header).toContain("Max-Age=1209600");
  expect(header).toContain("Path=/");
  expect(header).toContain("HttpOnly");
  expect(header).toContain("SameSite=Lax");
  expect(header).not.toContain("Domain");
  expect(header).not.toContain("Secure");
});

test("marks the cookie Secure, with the prefix that binds it to this host, on a request over HTTPS", async () => {
  const header = await sessionCookieHeader(secureRequest, token);
  expect(header).toMatch(/^__Host-portolab_session=[^;]+; /);
  expect(header).toContain("Secure");
  expect(header).toContain("HttpOnly");
  expect(header).toContain("SameSite=Lax");
});

test("reads the token from the cookie of the protocol of the request only", async () => {
  const header = await sessionCookieHeader(secureRequest, token);
  const cookie = header.split(";")[0] ?? "";
  expect(
    await readSessionToken(
      new Request(secureRequest, { headers: { Cookie: cookie } }),
    ),
  ).toEqual({ ok: true, value: token });
  expect(
    await readSessionToken(
      new Request(plainRequest, { headers: { Cookie: cookie } }),
    ),
  ).toBeUndefined();
  expect(await readSessionToken(secureRequest)).toBeUndefined();
});

test("fails to read a cookie that holds no token", async () => {
  const cookie = `portolab_session=${btoa(JSON.stringify("forged"))}`;
  expect(
    await readSessionToken(
      new Request(plainRequest, { headers: { Cookie: cookie } }),
    ),
  ).toEqual({
    ok: false,
    failure:
      'The cookie portolab_session must be two parts of 24 letters and digits joined by a dot, but it is "forged".',
  });
});

test("makes the browser forget the cookie, and tells whether a response sets it", async () => {
  const header = await expiredSessionCookieHeader(plainRequest);
  expect(header).toMatch(/^portolab_session=; /);
  expect(header).toContain("Max-Age=0");
  const response = new Response(null, { headers: { "Set-Cookie": header } });
  expect(setsSessionCookie(plainRequest, response)).toBe(true);
  expect(setsSessionCookie(plainRequest, new Response(null))).toBe(false);
});
