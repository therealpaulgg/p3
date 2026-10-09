import { describe, expect, test } from "bun:test";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { classifyRoute, DEFAULT_ROUTING_CLASSIFIERS, routingClassifierConfig } from "./classifier.ts";
import { classifyDelegation } from "./policy.ts";

const ctxWithoutClassifiers = { modelRegistry: { getAvailableOfType: async () => [] } } as unknown as ExtensionContext;
const choice = (choice: string, confidence: number) => ({ stopReason: "stop", answers: { tier: { type: "choice", choice, confidence } } });

/** Registry fake: `available` lists `provider/id` refs; `answer` maps a ref to a result or thrown error. */
function fakeCtx(available: string[], answer: (name: string) => unknown) {
  const calls: string[] = [];
  const availabilityCalls: string[] = [];
  const ctx = { modelRegistry: {
    getAvailableOfType: async (_type: string, provider: string) => {
      availabilityCalls.push(provider);
      return available.map((ref) => ({ provider: ref.slice(0, ref.indexOf("/")), id: ref.slice(ref.indexOf("/") + 1) })).filter((model) => model.provider === provider);
    },
    classify: async (model: { provider: string; id: string }) => {
      const name = `${model.provider}/${model.id}`;
      calls.push(name);
      const result = answer(name);
      if (result instanceof Error) throw result;
      return result;
    },
  } } as unknown as ExtensionContext;
  return { ctx, calls, availabilityCalls };
}

describe("routing classifier config", () => {
  test("defaults to the Jev pair when unset", () => {
    expect(DEFAULT_ROUTING_CLASSIFIERS).toEqual(["typesafe/jev-latest", "cloudflare-workers-ai/typesafe/jev"]);
    expect(routingClassifierConfig(undefined)).toEqual({ models: [{ provider: "typesafe", id: "jev-latest" }, { provider: "cloudflare-workers-ai", id: "typesafe/jev" }] });
    expect(routingClassifierConfig({ p3: {} }).models).toHaveLength(2);
  });
  test("splits provider at the first slash so model IDs may contain slashes", () => {
    expect(routingClassifierConfig({ p3: { routingClassifiers: ["openrouter/~typesafe/jev-latest", "openai/gpt-6-luna"] } }))
      .toEqual({ models: [{ provider: "openrouter", id: "~typesafe/jev-latest" }, { provider: "openai", id: "gpt-6-luna" }] });
  });
  test("an empty list disables classification", () => {
    expect(routingClassifierConfig({ p3: { routingClassifiers: [] } })).toEqual({ models: [] });
  });
  test("rejects malformed values with a descriptive error", () => {
    expect(routingClassifierConfig({ p3: { routingClassifiers: "typesafe/jev-latest" } }).error).toContain("must be an array");
    for (const entry of ["jev-latest", "/jev", "typesafe/", " typesafe/jev-latest", 42]) {
      const config = routingClassifierConfig({ p3: { routingClassifiers: [entry] } });
      expect(config.models).toEqual([]);
      expect(config.error).toContain("invalid p3.routingClassifiers entry");
    }
  });
});

describe("routing classification", () => {
  test("without native credentials retains the local capability decision", async () => {
    const local = classifyDelegation("List callers of UserService", "other");
    expect(await classifyRoute("List callers of UserService", "other", local, ctxWithoutClassifiers, { eligibleRoutes: ["luna"] })).toBe(local);
  });
  test("local fallback selects an actually eligible route on the preferred provider", async () => {
    const local = classifyDelegation("Implement the documented integration", "implement");
    const result = await classifyRoute("Implement the documented integration", "implement", local, ctxWithoutClassifiers, { eligibleRoutes: ["sonnet", "sol"], preferredProvider: "anthropic" });
    expect(result.target).toBe("sonnet");
    expect(result.tier).toBe("standard");
  });
  test("default Jev chooses capability, with eligible models resolved by code", async () => {
    let packet: any;
    const ctx = { modelRegistry: {
      getAvailableOfType: async (_type: string, provider: string) => provider === "typesafe" ? [{ provider: "typesafe", id: "jev-latest" }] : [],
      classify: async (_model: unknown, request: unknown) => { packet = request; return choice("small", 0.9); },
    } } as unknown as ExtensionContext;
    const result = await classifyRoute("Implement this exact rename", "implement", classifyDelegation("Implement this exact rename"), ctx, { eligibleRoutes: ["haiku", "luna"], preferredProvider: "anthropic" });
    expect(result.target).toBe("haiku");
    expect(result.rationale).toContain("typesafe/jev-latest selected small");
    expect(Object.keys(packet.questions.tier.criteria)).toEqual(["small", "standard", "strong", "unknown"]);
    expect(packet.state.repositoryComplexity).toContain("unknown");
  });
  test("uses a configured non-Jev classifier", async () => {
    const { ctx, calls } = fakeCtx(["typesafe/jev-latest", "cloudflare-workers-ai/@cf/cloudflare/clef"], () => choice("strong", 0.85));
    const result = await classifyRoute("Plan the migration", "plan", classifyDelegation("Plan the migration", "plan"), ctx, { eligibleRoutes: ["opus", "sol"], preferredProvider: "anthropic" }, routingClassifierConfig({ p3: { routingClassifiers: ["cloudflare-workers-ai/@cf/cloudflare/clef"] } }));
    expect(calls).toEqual(["cloudflare-workers-ai/@cf/cloudflare/clef"]);
    expect(result.tier).toBe("strong");
    expect(result.target).toBe("opus");
  });
  test("skips unavailable classifiers and falls through failures in order", async () => {
    const { ctx, calls, availabilityCalls } = fakeCtx(["openrouter/typesafe/jev-1.13", "openai/gpt-6-luna"], (name) => name === "openrouter/typesafe/jev-1.13" ? new Error("401 unauthorized") : choice("small", 0.9));
    const config = routingClassifierConfig({ p3: { routingClassifiers: ["typesafe/jev-latest", "openrouter/typesafe/jev-1.13", "openai/gpt-6-luna"] } });
    const result = await classifyRoute("Rename this field exactly", "implement", classifyDelegation("Rename this field exactly", "implement"), ctx, { eligibleRoutes: ["haiku", "luna"], preferredProvider: "openai-codex" }, config);
    expect(availabilityCalls).toEqual(["typesafe", "openrouter", "openai"]);
    expect(calls).toEqual(["openrouter/typesafe/jev-1.13", "openai/gpt-6-luna"]);
    expect(result.tier).toBe("small");
    expect(result.target).toBe("luna");
  });
  test("a non-stop result falls through to the next classifier", async () => {
    const { ctx, calls } = fakeCtx(["typesafe/jev-latest", "openai/gpt-6-luna"], (name) => name === "typesafe/jev-latest" ? { stopReason: "error", errorMessage: "overloaded", answers: {} } : choice("small", 0.9));
    const result = await classifyRoute("Rename this field exactly", "implement", classifyDelegation("Rename this field exactly", "implement"), ctx, { eligibleRoutes: ["haiku"] }, routingClassifierConfig({ p3: { routingClassifiers: ["typesafe/jev-latest", "openai/gpt-6-luna"] } }));
    expect(calls).toEqual(["typesafe/jev-latest", "openai/gpt-6-luna"]);
    expect(result.target).toBe("haiku");
  });
  test("a valid low-confidence answer is final and keeps the local tier", async () => {
    const { ctx, calls } = fakeCtx(["typesafe/jev-latest", "openai/gpt-6-luna"], () => choice("small", 0.5));
    const local = classifyDelegation("Implement the documented integration", "implement");
    const result = await classifyRoute("Implement the documented integration", "implement", local, ctx, { eligibleRoutes: ["haiku", "sonnet"] }, routingClassifierConfig({ p3: { routingClassifiers: ["typesafe/jev-latest", "openai/gpt-6-luna"] } }));
    expect(calls).toEqual(["typesafe/jev-latest"]);
    expect(result.tier).toBe(local.tier);
    expect(result.target).toBe("sonnet");
  });
  test("unknown classification preserves conservative local tier", async () => {
    const { ctx } = fakeCtx(["typesafe/jev-latest"], () => choice("unknown", 0.99));
    const result = await classifyRoute("Investigate", "other", classifyDelegation("Investigate"), ctx, { eligibleRoutes: ["haiku", "sonnet"] });
    expect(result.target).toBe("sonnet");
    expect(result.tier).toBe("standard");
  });
  test("when every classifier fails, local policy applies and the rationale names the failures", async () => {
    const { ctx } = fakeCtx(["typesafe/jev-latest"], () => new Error("network down"));
    const local = classifyDelegation("Implement the documented integration", "implement");
    const result = await classifyRoute("Implement the documented integration", "implement", local, ctx, { eligibleRoutes: ["sonnet"] });
    expect(result.tier).toBe(local.tier);
    expect(result.rationale).toContain("typesafe/jev-latest: network down");
    expect(result.rationale).toContain("local policy applied");
  });
  test("an empty list makes no classifier calls", async () => {
    const { ctx, calls, availabilityCalls } = fakeCtx(["typesafe/jev-latest"], () => choice("small", 0.99));
    const local = classifyDelegation("Implement the documented integration", "implement");
    const result = await classifyRoute("Implement the documented integration", "implement", local, ctx, { eligibleRoutes: ["sonnet"] }, routingClassifierConfig({ p3: { routingClassifiers: [] } }));
    expect(availabilityCalls).toEqual([]);
    expect(calls).toEqual([]);
    expect(result.tier).toBe(local.tier);
    expect(result.target).toBe("sonnet");
    expect(result.rationale).toBe(local.rationale);
  });
  test("invalid config makes no classifier calls and explains why", async () => {
    const { ctx, calls, availabilityCalls } = fakeCtx(["typesafe/jev-latest"], () => choice("small", 0.99));
    const result = await classifyRoute("Implement the documented integration", "implement", classifyDelegation("Implement the documented integration", "implement"), ctx, { eligibleRoutes: ["sonnet"] }, routingClassifierConfig({ p3: { routingClassifiers: ["jev-latest"] } }));
    expect(availabilityCalls).toEqual([]);
    expect(calls).toEqual([]);
    expect(result.target).toBe("sonnet");
    expect(result.rationale).toContain("Routing classifier config ignored");
  });
  test("a valid strong answer with no eligible strong route rejects instead of trying a weaker fallback", async () => {
    const { ctx, calls } = fakeCtx(["typesafe/jev-latest", "openai/gpt-6-luna"], (name) => choice(name === "typesafe/jev-latest" ? "strong" : "small", 0.95));
    const local = classifyDelegation("Rename this field exactly", "implement");
    expect(local.tier).not.toBe("strong");
    await expect(classifyRoute("Rename this field exactly", "implement", local, ctx, { eligibleRoutes: ["haiku", "luna"] }, routingClassifierConfig({ p3: { routingClassifiers: ["typesafe/jev-latest", "openai/gpt-6-luna"] } })))
      .rejects.toThrow("No eligible route for strong");
    expect(calls).toEqual(["typesafe/jev-latest"]);
  });
  test("confidence above 1 is malformed and falls through rather than being accepted", async () => {
    const { ctx, calls } = fakeCtx(["typesafe/jev-latest", "openai/gpt-6-luna"], (name) => name === "typesafe/jev-latest" ? choice("strong", 1.5) : choice("small", 0.9));
    const result = await classifyRoute("Rename this field exactly", "implement", classifyDelegation("Rename this field exactly", "implement"), ctx, { eligibleRoutes: ["haiku", "opus"] }, routingClassifierConfig({ p3: { routingClassifiers: ["typesafe/jev-latest", "openai/gpt-6-luna"] } }));
    expect(calls).toEqual(["typesafe/jev-latest", "openai/gpt-6-luna"]);
    expect(result.tier).toBe("small");
    expect(result.target).toBe("haiku");
  });
  test("confidence above 1 from the only classifier keeps local policy and names the problem", async () => {
    const { ctx } = fakeCtx(["typesafe/jev-latest"], () => choice("small", 1.01));
    const local = classifyDelegation("Implement the documented integration", "implement");
    const result = await classifyRoute("Implement the documented integration", "implement", local, ctx, { eligibleRoutes: ["haiku", "sonnet"] });
    expect(result.tier).toBe(local.tier);
    expect(result.rationale).toContain("malformed confidence 1.01");
  });
  test("never emits an ineligible or weaker target", async () => {
    await expect(classifyRoute("Diagnose a race condition", "other", classifyDelegation("Diagnose a race condition"), ctxWithoutClassifiers, { eligibleRoutes: ["haiku"] })).rejects.toThrow("No eligible route for strong");
  });
});
