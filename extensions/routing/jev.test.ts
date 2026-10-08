import { describe, expect, test } from "bun:test";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { classifyWithJev } from "./jev.ts";
import { classifyDelegation } from "./policy.ts";

const ctxWithoutJev = { modelRegistry: { getAvailableOfType: async () => [] } } as unknown as ExtensionContext;

describe("Jev routing", () => {
  test("without native credentials retains the local capability decision", async () => {
    const local = classifyDelegation("List callers of UserService", "other");
    expect(await classifyWithJev("List callers of UserService", "other", local, ctxWithoutJev, { eligibleRoutes: ["luna"] })).toBe(local);
  });
  test("local fallback selects an actually eligible route on the preferred provider", async () => {
    const local = classifyDelegation("Implement the documented integration", "implement");
    const result = await classifyWithJev("Implement the documented integration", "implement", local, ctxWithoutJev, { eligibleRoutes: ["sonnet", "sol"], preferredProvider: "anthropic" });
    expect(result.target).toBe("sonnet");
    expect(result.tier).toBe("standard");
  });
  test("Jev chooses capability, with eligible models resolved by code", async () => {
    let packet: any;
    const ctx = { modelRegistry: {
      getAvailableOfType: async () => [{ provider: "typesafe", id: "jev-latest" }],
      classify: async (_model: unknown, request: unknown) => { packet = request; return { stopReason: "stop", answers: { tier: { type: "choice", choice: "small", confidence: 0.9 } } }; },
    } } as unknown as ExtensionContext;
    const result = await classifyWithJev("Implement this exact rename", "implement", classifyDelegation("Implement this exact rename"), ctx, { eligibleRoutes: ["haiku", "luna"], preferredProvider: "anthropic" });
    expect(result.target).toBe("haiku");
    expect(Object.keys(packet.questions.tier.criteria)).toEqual(["small", "standard", "strong", "unknown"]);
    expect(packet.state.repositoryComplexity).toContain("unknown");
  });
  test("unknown classification preserves conservative local tier", async () => {
    const ctx = { modelRegistry: {
      getAvailableOfType: async () => [{ provider: "typesafe", id: "jev-latest" }],
      classify: async () => ({ stopReason: "stop", answers: { tier: { type: "choice", choice: "unknown", confidence: 0.99 } } }),
    } } as unknown as ExtensionContext;
    const result = await classifyWithJev("Investigate", "other", classifyDelegation("Investigate"), ctx, { eligibleRoutes: ["haiku", "sonnet"] });
    expect(result.target).toBe("sonnet");
    expect(result.tier).toBe("standard");
  });
  test("never emits an ineligible or weaker target", async () => {
    await expect(classifyWithJev("Diagnose a race condition", "other", classifyDelegation("Diagnose a race condition"), ctxWithoutJev, { eligibleRoutes: ["haiku"] })).rejects.toThrow("No eligible route for strong");
  });
});
