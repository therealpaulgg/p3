import { inferPhase, type TaskPhase } from "./workflow.ts";

export type RouteName = "sol" | "luna" | "opus" | "sonnet" | "haiku";
export type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high";
export type CapabilityTier = "small" | "standard" | "strong";
export type DelegationTarget = RouteName;

export interface Route {
  label: string;
  provider: string;
  model: string;
  thinking: ThinkingLevel;
  purpose: string;
  /** Automatic workers launch a failover wrapper while telemetry starts on the physical route. */
  launchModel?: string;
}

export interface RoutingDecision {
  target: DelegationTarget;
  tier?: CapabilityTier;
  delegate: boolean;
  confidence: "high" | "medium";
  rationale: string;
}

export const routes: Record<RouteName, Route> = {
  sol: { label: "Sol", provider: "openai-codex", model: "gpt-6.1-sol", thinking: "medium", purpose: "Standard coding and demanding reasoning" },
  luna: { label: "Luna", provider: "openai-codex", model: "gpt-6-luna", thinking: "high", purpose: "Exact, bounded, cheaply checkable work" },
  opus: { label: "Opus", provider: "anthropic", model: "claude-opus-5-5", thinking: "medium", purpose: "Ambiguous, long-horizon, hard-to-check or consequential work" },
  sonnet: { label: "Sonnet", provider: "anthropic", model: "claude-sonnet-5-5", thinking: "high", purpose: "Well-scoped coding and ordinary investigation" },
  haiku: { label: "Haiku", provider: "anthropic", model: "claude-haiku-5-5", thinking: "medium", purpose: "Exact, bounded, cheaply checkable work" },
};

export function clampThinkingLevel(level: string | undefined): ThinkingLevel {
  if (level === "off" || level === "minimal" || level === "low" || level === "medium" || level === "high") return level;
  return level === "xhigh" || level === "max" ? "high" : "medium";
}

export const routeTier: Record<RouteName, CapabilityTier> = {
  luna: "small", haiku: "small", sol: "standard", sonnet: "standard", opus: "strong",
};

// Stable tie order, not a provider capability or subscription-budget ranking.
export const tierCandidates: Record<CapabilityTier, readonly RouteName[]> = {
  small: ["luna", "haiku"], standard: ["sol", "sonnet"], strong: ["opus", "sol"],
};

export interface RouteSelectionOptions {
  isAvailable: (name: RouteName) => boolean;
  preferredRoute?: RouteName;
  preferredProvider?: string;
  providerForRoute?: (name: RouteName) => string;
  isCoolingDown?: (provider: string) => boolean;
}

/** Eligibility comes from the caller's real auth, health, context and modality checks. Never downgrade. */
export function selectEligibleRoute(tier: CapabilityTier, options: RouteSelectionOptions): RouteName | undefined {
  const tiers: CapabilityTier[] = tier === "small" ? ["small", "standard", "strong"] : tier === "standard" ? ["standard", "strong"] : ["strong"];
  const provider = options.providerForRoute ?? ((name: RouteName) => routes[name].provider);
  for (const candidateTier of tiers) {
    const eligible = tierCandidates[candidateTier].filter((name) => options.isAvailable(name) && !options.isCoolingDown?.(provider(name)));
    if (options.preferredRoute && eligible.includes(options.preferredRoute)) return options.preferredRoute;
    const sameProvider = eligible.find((name) => provider(name) === options.preferredProvider);
    if (sameProvider) return sameProvider;
    if (eligible.length) return eligible[0];
  }
  return undefined;
}

export function chooseRouteForTier(tier: CapabilityTier, isAvailable: (name: RouteName) => boolean, preferredProvider?: string): RouteName | undefined {
  return selectEligibleRoute(tier, { isAvailable, preferredProvider });
}

export const fallbackChains: Record<RouteName, RouteName[]> = {
  luna: ["luna", "haiku", "sol", "sonnet", "opus"],
  haiku: ["haiku", "luna", "sonnet", "sol", "opus"],
  sol: ["sol", "sonnet", "opus"],
  sonnet: ["sonnet", "sol", "opus"],
  opus: ["opus", "sol"],
};

/** Conservative offline fallback: task category alone never establishes difficulty. */
export function classifyDelegation(task: string, _phase: TaskPhase = inferPhase(task)): RoutingDecision {
  const text = task.toLowerCase();
  const strong = /\b(ambiguous|architecture|architectural|high[- ]consequence|high[- ]risk|production decision|destructive|hard to reverse|security[- ]critical|incident|cross[- ]cutting|undocumented invariants|race condition|deadlock|intermittent|elusive|long[- ]horizon|trade[- ]offs?)\b/.test(text);
  if (strong) return { target: "opus", tier: "strong", delegate: false, confidence: "high", rationale: "Ambiguity, long dependencies, difficult verification or costly mistakes require a strong route." };
  const bounded = /\b(find where|locate|list callers|list references|extract exact|copy the named|re[- ]run (the )?checks|exact rename|rename the field|change (this|the) (label|css spacing)|replace the literal)\b/.test(text);
  const unresolved = /\b(unknown|investigate|decide|design|root[- ]cause|migration|refactor|polish)\b/.test(text);
  if (bounded && !unresolved) return { target: "luna", tier: "small", delegate: true, confidence: "medium", rationale: "An exact short assignment with an independently checkable result can use a small route, including tiny implementation." };
  return { target: "sol", tier: "standard", delegate: true, confidence: "medium", rationale: "Unknown difficulty or ordinary bounded coding stays on a standard route; category alone does not justify a premium." };
}

export function classifyModelRoute(_task: string, decision = classifyDelegation(_task)): RouteName {
  return decision.target;
}

export function planFallback(requested: RouteName, explicit: boolean, isAvailable: (route: RouteName) => boolean): { route: RouteName; fallbackFrom?: RouteName } | { error: string } {
  if (explicit) return isAvailable(requested) ? { route: requested } : { error: `Explicit route ${requested} is unavailable; no fallback was applied` };
  for (const candidate of fallbackChains[requested]) if (isAvailable(candidate)) return candidate === requested ? { route: candidate } : { route: candidate, fallbackFrom: requested };
  return { error: `No available model route. Tried: ${fallbackChains[requested].join(", ")}` };
}
