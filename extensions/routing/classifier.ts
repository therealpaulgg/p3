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

/** Ordered `provider/model` classifier references used when settings do not configure `p3.routingClassifiers`. */
export const DEFAULT_ROUTING_CLASSIFIERS = ["typesafe/jev-latest", "cloudflare-workers-ai/typesafe/jev"];
const CLASSIFIER_DEADLINE_MS = 5_000;

export interface ClassifierRef { provider: string; id: string }
export interface RoutingClassifierConfig { models: ClassifierRef[]; error?: string }

/** Reads `p3.routingClassifiers` from merged Pi settings. An empty list disables classification. */
export function routingClassifierConfig(settings: unknown): RoutingClassifierConfig {
  const configured = (settings as { p3?: { routingClassifiers?: unknown } } | undefined)?.p3?.routingClassifiers;
  if (configured === undefined) return routingClassifierConfig({ p3: { routingClassifiers: DEFAULT_ROUTING_CLASSIFIERS } });
  if (!Array.isArray(configured)) return { models: [], error: "p3.routingClassifiers must be an array of \"provider/model\" strings" };
  const models: ClassifierRef[] = [];
  for (const entry of configured) {
    // Provider IDs contain no slash; model IDs may (e.g. cloudflare-workers-ai/typesafe/jev).
    const slash = typeof entry === "string" ? entry.indexOf("/") : -1;
    if (typeof entry !== "string" || slash <= 0 || slash === entry.trim().length - 1 || entry !== entry.trim()) {
      return { models: [], error: `invalid p3.routingClassifiers entry ${JSON.stringify(entry)}; expected "provider/model"` };
    }
    models.push({ provider: entry.slice(0, slash), id: entry.slice(slash + 1) });
  }
  return { models };
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

/**
 * A configured classifier judges capability, while code applies real eligibility and provider preference.
 * Classifiers are tried in order within one shared deadline; only unavailable or failed ones fall through.
 * A valid but low-confidence or `unknown` answer is final and keeps the conservative local tier.
 */
export async function classifyRoute(brief: string, phase: TaskPhase, local: RoutingDecision, ctx: ExtensionContext, context: ClassificationContext = {}, config: RoutingClassifierConfig = routingClassifierConfig(undefined)): Promise<RoutingDecision> {
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
  if (config.error) return resolveDecision({ ...local, rationale: `${local.rationale} Routing classifier config ignored: ${config.error}.` });
  const request = {
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
        type: "choice" as const,
        instructions: "Choose the capability needed for the whole assignment using ambiguity, dependency horizon, checkability and consequences, not task category. Do not invent repository complexity, quota, cost or latency. Missing facts are unknown. Physical model/provider selection is handled by code, not this question.",
        // Native Pi's classifier schema accepts string criteria; preserve structured cards as JSON.
        criteria: Object.fromEntries(Object.entries(capabilityCriteria).map(([key, card]) => [key, JSON.stringify(card)])),
      },
    },
  };
  const deadline = Date.now() + CLASSIFIER_DEADLINE_MS;
  const signal = AbortSignal.timeout(CLASSIFIER_DEADLINE_MS);
  const available = new Map<string, Promise<readonly { provider: string; id: string }[]>>();
  const failures: string[] = [];
  let decision: RoutingDecision | undefined;
  // Only classifier transport/answer failures fall through; eligibility errors from resolveDecision must propagate.
  for (const ref of config.models) {
    const name = `${ref.provider}/${ref.id}`;
    const remaining = deadline - Date.now();
    if (remaining <= 0 || signal.aborted) { failures.push(`${name}: deadline exceeded`); break; }
    try {
      if (!available.has(ref.provider)) available.set(ref.provider, ctx.modelRegistry.getAvailableOfType("classifier", ref.provider, { signal }));
      const model = (await available.get(ref.provider)!).find((candidate) => candidate.provider === ref.provider && candidate.id === ref.id);
      if (!model) continue; // Not configured or authenticated in Pi; try the next classifier quietly.
      const result = await ctx.modelRegistry.classify(model as Parameters<typeof ctx.modelRegistry.classify>[0], request, { signal, timeoutMs: remaining, maxRetries: 0 });
      const answer = result.answers.tier;
      if (result.stopReason !== "stop" || answer?.type !== "choice") { failures.push(`${name}: ${result.errorMessage ?? result.stopReason}`); continue; }
      if (!Number.isFinite(answer.confidence) || answer.confidence < 0 || answer.confidence > 1) { failures.push(`${name}: malformed confidence ${answer.confidence}`); continue; }
      if (answer.confidence >= MIN_CONFIDENCE && ["small", "standard", "strong"].includes(answer.choice)) {
        const tier = answer.choice as CapabilityTier;
        decision = { ...local, tier, delegate: true, confidence: answer.confidence >= 0.8 ? "high" : "medium", rationale: `${name} selected ${tier} capability (confidence ${answer.confidence.toFixed(2)}).` };
      } else decision = local;
      break;
    } catch (error) {
      failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (decision) return resolveDecision(decision);
  if (failures.length === 0) return resolveDecision(local);
  return resolveDecision({ ...local, rationale: `${local.rationale} Routing classifier unavailable (${failures.join("; ").slice(0, 300)}); local policy applied.` });
}
