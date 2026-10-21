import { expect, it } from "vite-plus/test";

import { isGuardedPath, routeDecision } from "@/lib/route-guard";

it("sends a signed-in visitor from the landing page to the ledger", () => {
  expect(routeDecision("/", true)).toBe("dashboard");
});

it("lets an anonymous visitor read the landing page", () => {
  expect(routeDecision("/", false)).toBe("allow");
});

it("sends an anonymous visitor on a protected route to sign-in", () => {
  expect(routeDecision("/dashboard", false)).toBe("sign-in");
  expect(routeDecision("/account/abc", false)).toBe("sign-in");
  expect(routeDecision("/transaction/create", false)).toBe("sign-in");
});

it("lets a signed-in visitor through a protected route", () => {
  expect(routeDecision("/dashboard", true)).toBe("allow");
  expect(routeDecision("/account/abc", true)).toBe("allow");
});

it("leaves public routes alone either way", () => {
  expect(routeDecision("/sign-in", true)).toBe("allow");
  expect(routeDecision("/sign-up", false)).toBe("allow");
});

it("only pays for a session lookup on the landing page and protected routes", () => {
  expect(isGuardedPath("/")).toBe(true);
  expect(isGuardedPath("/dashboard")).toBe(true);
  expect(isGuardedPath("/account/abc")).toBe(true);
  expect(isGuardedPath("/transaction/abc/edit")).toBe(true);
  expect(isGuardedPath("/sign-in")).toBe(false);
  expect(isGuardedPath("/sign-up")).toBe(false);
  expect(isGuardedPath("/llms.txt")).toBe(false);
});
