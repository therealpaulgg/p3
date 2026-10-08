import { describe, expect, test } from "bun:test";
import { chooseRouteForTier, clampThinkingLevel, classifyDelegation, classifyModelRoute, planFallback, routes } from "./policy.ts";

describe("capability routing policy", () => {
  const cases = [
    ["Design an architecture and implementation plan", "strong"],
    ["Implement a difficult cross-cutting migration", "strong"],
    ["Make an ambiguous high-risk production decision", "strong"],
    ["Find where UserService is defined and list callers", "small"],
    ["Rename the field and verify via the build", "small"],
    ["Implement this exact rename", "small"],
    ["Change this CSS spacing literal to 12px", "small"],
    ["Add tests mirroring the existing EvaluationServiceTests", "standard"],
    ["Animate graph layout transitions and verify with the build", "standard"],
    ["Fix a reproducible UI bug", "standard"],
    ["Re-run the checks and list any failing callers", "small"],
    ["Diagnose the intermittent crash when the map loads", "strong"],
    ["Polish the SwiftUI layout of the People screen", "standard"],
    ["Do this ordinary routed task", "standard"],
  ] as const;
  for (const [task, tier] of cases) test(task, () => {
    const decision = classifyDelegation(task);
    expect(decision.tier).toBe(tier);
    expect(classifyModelRoute(task, decision)).toBe(decision.target);
  });
  test("explicit implement phase permits exact bounded work", () => expect(classifyDelegation("Implement this exact rename", "implement").tier).toBe("small"));
  test("exports the five approved defaults", () => {
    expect(Object.keys(routes)).toEqual(["sol", "luna", "opus", "sonnet", "haiku"]);
    expect(Object.values(routes).map((route) => route.thinking)).toEqual(["medium", "high", "medium", "high", "medium"]);
  });
  test("clamps above-high effort", () => {
    expect(clampThinkingLevel("max")).toBe("high");
    expect(clampThinkingLevel("xhigh")).toBe("high");
    expect(clampThinkingLevel("high")).toBe("high");
    expect(clampThinkingLevel(undefined)).toBe("medium");
  });
  test("selects by eligibility and suitable current provider without downgrading", () => {
    expect(chooseRouteForTier("small", () => true, "anthropic")).toBe("haiku");
    expect(chooseRouteForTier("standard", () => true, "anthropic")).toBe("sonnet");
    expect(chooseRouteForTier("strong", () => true, "openai-codex")).toBe("sol");
    expect(chooseRouteForTier("small", (name) => name === "sonnet")).toBe("sonnet");
    expect(chooseRouteForTier("strong", (name) => name === "luna")).toBeUndefined();
  });
});

describe("fallback policy", () => {
  test("implicit Luna falls back visibly to Sol", () => {
    expect(planFallback("luna", false, route => route === "sol")).toEqual({ route: "sol", fallbackFrom: "luna" });
  });
  test("explicit route never falls back", () => {
    expect(planFallback("luna", true, route => route === "sol")).toEqual({ error: "Explicit route luna is unavailable; no fallback was applied" });
  });
  test("exhaustion reports tried routes", () => {
    const result = planFallback("sol", false, () => false);
    expect("error" in result && result.error).toContain("Tried: sol, sonnet, opus");
  });
});
