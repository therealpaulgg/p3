import type { JsonValue } from "@earendil-works/pi-ai";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { routes, routeTier, selectEligibleRoute, type CapabilityTier, type RouteName, type RoutingDecision } from "./policy.ts";
import { providerIsCoolingDown } from "./failover.ts";
import type { TaskPhase } from "./workflow.ts";

const MAX_BRIEF_CHARS = 6_000;
// Conservative initial gate, not a measured probability of task success.
const MIN_CONFIDENCE = 0.7;

function classifierJson(value: unknown, depth = 0): JsonValue {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "string") return value.slice(0, MAX_BRIEF_CHARS);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (depth >= 6) return "unknown";
  if (Array.isArray(value)) return value.slice(-32).map((item) => classifierJson(item, depth + 1));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, classifierJson(item, depth + 1)]));
  return "unknown";
}

export interface ClassificationContext extends Record<string, unknown> {
  eligibleRoutes?: RouteName[];
  preferredProvider?: string;
  candidates?: Array<{ key: RouteName; provider: string; id: string; reasoning?: boolean; contextWindow?: number; maxTokens?: number; costPerMillionTokens?: unknown }>;
  estimatedContextTokens?: number;
  needsImages?: boolean;
  recentConversation?: unknown;
  previouslyCachedTokens?: number;
}

export async function getJevModel(ctx: ExtensionContext, signal: AbortSignal) {
  const models = await ctx.modelRegistry.getAvailableOfType("classifier", "typesafe", { signal });
  const jev = models.find((model) => model.provider === "typesafe" && model.id === "jev-latest");
  if (jev) return jev;
  const cloudflareModels = await ctx.modelRegistry.getAvailableOfType("classifier", "cloudflare-workers-ai", { signal });
  return cloudflareModels.find((model) => model.provider === "cloudflare-workers-ai" && model.id === "typesafe/jev");
}

const capabilityCriteria = {
  small: {
    covers: "Exact target/output, short dependency horizon, little ambiguity, low consequences, cheap independent checking. Tiny implementation is allowed.",
    positiveExamples: ["Change this CSS spacing literal to 12px", "Implement this exact field rename", "Find the named symbol and list callers", "Run the specified check and return output"],
    negativeExamples: ["Determine requirements from conflicting evidence", "Investigate an unknown intermittent hang", "Change a security-sensitive invariant"],
  },
  standard: {
    covers: "Well-scoped feature, ordinary bug or refactor with clear acceptance criteria, moderate cross-file reasoning and ordinary code/check feedback.",
    positiveExamples: ["Implement the documented API integration", "Fix a reproducible bug with a known failing case", "Implement an agreed UI layout"],
    negativeExamples: ["Replace one supplied literal", "Preserve undocumented concurrency invariants across many subsystems", "Make an irreversible migration decision"],
  },
  strong: {
    covers: "High ambiguity, long dependency horizon, subtle judgment, difficult verification or high-consequence errors. Not a blanket UI/debug/research premium.",
    positiveExamples: ["Diagnose an elusive race", "Plan a migration with uncertain invariants", "Resolve nuanced interaction tradeoffs", "Reason about a security-critical change"],
    negativeExamples: ["Exact CSS spacing edit", "Ordinary reproducible bug with clear criteria", "Copy named rows from a supplied source"],
  },
  unknown: {
    covers: "Insufficient facts to distinguish task difficulty; preserve the conservative local standard/strong choice.",
    positiveExamples: ["Do this task, with no acceptance criteria or scope", "Necessary repository facts are not supplied"],
    negativeExamples: ["A fully specified exact edit with a cheap check", "Explicitly high-consequence or elusive investigation"],
  },
};

/** Jev judges capability, while code applies real eligibility and provider preference. */
export async function classifyWithJev(brief: string, phase: TaskPhase, local: RoutingDecision, ctx: ExtensionContext, context: ClassificationContext = {}): Promise<RoutingDecision> {
  const providers = new Map<RouteName, string>((context.candidates ?? []).map((candidate) => [candidate.key, candidate.provider]));
  const eligibleRoutes = context.eligibleRoutes ?? (Object.keys(routes) as RouteName[]).filter((name) => {
    const route = routes[name];
    const codex = ctx.modelRegistry.find?.(route.provider, route.model);
    const model = codex && ctx.modelRegistry.hasConfiguredAuth(codex) ? codex
      : route.provider === "openai-codex" ? ctx.modelRegistry.find?.("openai", route.model) : codex;
    if (!model || !ctx.modelRegistry.hasConfiguredAuth(model)) return false;
    providers.set(name, model.provider);
    return !providerIsCoolingDown(model.provider);
  });
  const preferredProvider = context.preferredProvider ?? ctx.model?.provider;
  const resolveDecision = (decision: RoutingDecision): RoutingDecision => {
    const tier = decision.tier ?? routeTier[decision.target];
    const target = selectEligibleRoute(tier, {
      isAvailable: (name) => eligibleRoutes.includes(name), preferredProvider,
      providerForRoute: (name) => providers.get(name) ?? routes[name].provider,
    });
    if (!target) throw new Error(`No eligible route for ${tier} capability`);
    return target === decision.target && decision.tier === tier ? decision : { ...decision, tier, target };
  };
  let decision = local;
  try {
    const signal = AbortSignal.timeout(5_000);
    const model = await getJevModel(ctx, signal);
    if (model) {
      const result = await ctx.modelRegistry.classify(model, {
        state: {
          phase, brief: brief.slice(0, MAX_BRIEF_CHARS), eligibleRoutes,
          preferredProvider: preferredProvider ?? "unknown",
          candidates: classifierJson(context.candidates),
          current: classifierJson(context.current),
          taskPhase: classifierJson(context.taskPhase ?? phase),
          repositoryComplexity: classifierJson(context.repositoryComplexity ?? "unknown; do not infer from task category"),
          estimatedContextTokens: classifierJson(context.estimatedContextTokens),
          needsImages: classifierJson(context.needsImages),
          recentConversation: classifierJson(context.recentConversation),
          previouslyCachedTokens: classifierJson(context.previouslyCachedTokens),
          consequences: classifierJson(context.consequences ?? "unknown unless stated in the brief"),
        },
        questions: {
          tier: {
            type: "choice",
            instructions: "Choose the capability needed for the whole assignment using ambiguity, dependency horizon, checkability and consequences, not task category. Do not invent repository complexity, quota, cost or latency. Missing facts are unknown. Physical model/provider selection is handled by code, not this question.",
            // Native Pi's classifier schema accepts string criteria; preserve structured cards as JSON.
            criteria: Object.fromEntries(Object.entries(capabilityCriteria).map(([key, card]) => [key, JSON.stringify(card)])),
          },
        },
      }, { signal, timeoutMs: 5_000, maxRetries: 0 });
      const answer = result.answers.tier;
      if (result.stopReason === "stop" && answer?.type === "choice" && Number.isFinite(answer.confidence) && answer.confidence >= MIN_CONFIDENCE && ["small", "standard", "strong"].includes(answer.choice)) {
        const tier = answer.choice as CapabilityTier;
        decision = { ...local, tier, delegate: true, confidence: answer.confidence >= 0.8 ? "high" : "medium", rationale: `Jev selected ${tier} capability (confidence ${answer.confidence.toFixed(2)}).` };
      }
    }
  } catch { /* Native auth/classifier failure retains the local capability decision. */ }
  return resolveDecision(decision);
}
