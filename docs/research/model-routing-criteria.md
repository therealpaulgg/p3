# Benchmark-informed model routing criteria

Research date: 2026-10-08. Research only; no routing/configuration changes or model evaluations were performed.

## Scope and evidence status

The requested candidates are Claude Sonnet 5.5, Claude Haiku 5.5, GPT-6 Luna, and the existing Opus/Sol routes. Companion reports investigate exact public model identities and published benchmark evidence:

- [Claude benchmark research](claude-model-benchmarks.md)
- [OpenAI benchmark research](openai-model-benchmarks.md)

Exact public model IDs were verified for all requested candidates; no older-model proxies were needed. Local model names and registry entries still do not independently establish the backend served to this account. Local prices/context limits are configuration metadata, not independent verification of provider capabilities. Do not attach a different model's benchmark scores to these names without an explicit verified mapping.

## The most useful recovered coding comparison

Cognition's live FrontierCode **1.1 Main** leaderboard, accessed 2026-10-08 [5]:

| Model | Displayed best effort | Weighted rubric score | Displayed cost/rollout | Harness |
| --- | --- | ---: | ---: | --- |
| Claude Opus 5.5 | medium | 54.6% | $0.80 | Claude Code |
| Claude Sonnet 5.5 | xhigh | 52.1% | $1.59 | Claude Code |
| GPT-6.1 Sol | medium | 50.2% | $0.36 | Codex |
| Claude Haiku 5.5 | max | 46.4% | $1.33 | Claude Code |
| GPT-6 Luna | max | 42.4% | $0.10 | Codex |

This is the hardest 100 of 150 tasks; each row uses that model's best-scoring effort. It is a system-level comparison with different harnesses and efforts, not a matched model-only experiment. Score is a weighted rubric aggregate, not a pass rate. No uncertainty intervals were captured. Cost/rollout is neither cost per successful task nor subscription usage; Sonnet's October 7 cache-price change may not be reflected in displayed historical costing.

The useful findings are narrower than a total ranking:

- On this difficult coding workload, Opus medium had the top displayed Claude score and lowest displayed Claude cost/rollout. Cheaper tokens do not imply cheaper coding tasks.
- Sol 6.1 medium scored above Luna max, but Luna's displayed rollout cost was lower. This supports a cost/quality tradeoff, not a small-task cutoff.
- More effort is not automatically better: the Claude report records Sonnet max at 46.2% versus xhigh at 52.1%, and Opus max at 54.4% versus medium at 54.6%.
- Anthropic's Terminal-Bench 4.0 run reports Sonnet above Opus (70.6% versus 66.4%), but with differing efforts, trial counts, safeguard/fallback, and network conditions. There is no universally dominant model.
- Haiku has independently measured high output throughput, but throughput is not first-answer latency or accepted-task time. Its max-effort coding run used 181.4K output tokens/rollout; treat it as a narrow-work candidate, not a cheap general coding substitute.

The OpenAI report originally recovered no coding scores from provider docs; primary follow-up discovered the rendered Cognition OpenAI entries above. The final report includes them.

## What the current routing actually does

Inspection of the installed p3 package (`~/.pi/agent/git/github.com/therealpaulgg/p3`, commit `8c83692`) and personal `~/.pi/agent/extensions/auto.ts` found:

- p3 exposes only Sol, Luna, and Opus. Sonnet and Haiku cannot win a Jev decision because they are not candidates.
- The installed Sol route is `openai-codex/gpt-6.1-sol`; the research checkout at commit `8ec8417` still uses `gpt-6-sol`. The installed route is the live evidence.
- p3 sends Jev only a task brief and phase, plus descriptions of the three choices. It describes Opus as more intelligent and faster than Sol, but supplies no benchmark evidence or task-level latency measurements for that assertion.
- p3 categorically rejects Luna for every planning or implementation task, independent of task difficulty. This blocks even small, explicit, mechanically checkable edits.
- The separate primary-session Auto virtual model has the same three candidates. It considers recent conversation, context fit, image support, pricing metadata, and cache loss, but its prose also excludes Luna from demanding work.
- Sonnet 5.5 appears in custom `models.json`; Haiku 5.5 does not appear among the custom entries inspected. This does not prove Haiku is absent from a dynamic provider catalog.
- Launch-time fallback checks authentication/model presence, not remaining subscription quota. Exhaustion handling remains a separate concern.

Sources: installed `extensions/routing/policy.ts`, `extensions/routing/jev.ts`, `extensions/model-routing.ts`; personal `extensions/auto.ts`; selected non-secret fields in personal `models.json`. Do not copy credentials into this report.

## Read benchmarks as evidence of task fit, not a universal ranking

| Evidence | Useful inference | What it does not establish |
| --- | --- | --- |
| SWE-bench Verified / Pro | Ability to resolve repository issues under the reported scaffold and compute budget | Accuracy on simple extraction, visual quality, or equivalent performance in Pi |
| Terminal-Bench, with exact version | End-to-end terminal/tool-driven task completion under the reported harness | Identical performance across agent scaffolds, timeout budgets, or reasoning efforts |
| Tool-use benchmarks | Correct tool selection/arguments and multi-step execution in that environment | Permission to execute risky operations or reliability on unfamiliar tools |
| Reasoning benchmarks | Capacity for difficult reasoning in the tested domain | That every coding task needs a reasoning-heavy model |
| Instruction-following / extraction evaluations | Compliance and bounded information handling | Safe autonomous investigation or subtle architectural judgment |
| Provider speed claims / throughput measurements | Possible latency advantage under that measurement setup | Time to an accepted patch, including retries and verification |

SWE-bench's owner describes repository issue-to-patch evaluation and Verified's 500 engineer-confirmed solvable problems [1]. Terminal-Bench's owner describes a task dataset plus an execution harness and task-specific verification [2]. Compare scores only when dataset version, agent scaffold, tools, reasoning effort, attempts, and token/time budgets are compatible. Provider-reported results and independently run results should remain labeled separately.

## Proposed initial routing rubric — hypotheses, not measured guarantees

The useful boundary is **ambiguity + task horizon + verification difficulty + consequences**, not whether the task contains the word “implementation,” “research,” “UI,” or “debug.” Task length alone is a poor proxy: a one-line concurrency change can require more judgment than a large mechanical rewrite.

| Tier | Entry conditions | Suitable assignments | Reasons to choose a stronger tier |
| --- | --- | --- | --- |
| Small-work trial candidates: Haiku; separately, Luna | Explicit target and output; supplied or easily located evidence; short execution path; low-consequence mistakes; independent, cheap verification | Locate callers; extract exact values; enumerate changed symbols; summarize supplied evidence. Exact renames, known-label edits, or tests following an existing pattern are trial candidates, not proven coding assignments | Must decide which sources are trustworthy, resolve conflicting evidence, discover requirements, coordinate many tools, diagnose an unknown cause, or fails the independent acceptance check |
| General coding: Sonnet / Sol candidates | Bounded feature or bug; clear acceptance criteria; moderate cross-file reasoning; ordinary code/test feedback | Implement a well-specified feature; refactor a known seam; fix a reproducible bug; integrate a documented API; implement an agreed UI layout | Intermittent failure, long-horizon investigation, many coupled subsystems, uncertain requirements, or costly hidden regressions |
| Strong: Opus / stronger Sol setting candidates | High ambiguity, difficult verification, long dependency chain, subtle judgment, or high-consequence failure | Races/deadlocks; elusive regressions; architecture tradeoffs; migrations with unclear invariants; nuanced visual/interaction decisions; security-sensitive reasoning | A stronger model does not replace user authorization or independent checks |

These roles are an initial policy proposal, not evidence of equivalent capability within a row. Sonnet's bounded-work niche is supported by Anthropic's positioning and selected tool/terminal results, not proof that it beats Opus on task cost. Keep Haiku and Luna, and Sonnet and Sol, as separately evidenced candidates. Exact provider preference requires comparable evidence and task outcomes from this installation. Do not infer a universal Haiku-versus-Luna or Sonnet-versus-Sol ordering. Do not force difficult coding through a nominally cheap tier before Opus/Sol when correction or validation is expensive.

Examples distinguishing task type from difficulty:

- “Find the official benchmark table and copy the named rows with URLs” can be small-model work. “Determine which benchmark results are comparable and recommend a policy” is judgment-heavy research.
- “Change this CSS spacing to 12px” can be small-model work. “Design a coherent responsive interaction” is not.
- “Implement this exact rename” can be small-model work. “Implement a concurrency fix while preserving undocumented invariants” is not.
- “Run this check and return its output” can be small-model work. “Investigate why it hangs intermittently” is not.

## What Jev should be told

Keep deterministic constraints in code: authentication/provider health, explicit model requests, context fit, input modality, and available budget. Jev should judge semantic suitability among eligible candidates, using task-specific facts and concise model capability cards.

A capability card should distinguish:

- Verified provider/model identity and evidence date.
- Best-fit task conditions, exclusions, and counterexamples.
- Relevant benchmark name/version, score, scaffold, reasoning effort, and evidence provenance.
- Measured local latency/cost where available; otherwise “unknown.”

A compact routing instruction proposal:

> Choose a model suitable for the whole assignment; among candidates with evidence of adequate quality for this task class, prefer lower expected total cost. Judge ambiguity, dependency horizon, required tool coordination, verification difficulty, and consequences of an incorrect result. A small implementation is not automatically difficult; a short investigation is not automatically easy. Use small models for explicit, bounded, independently checkable assignments. Use general coding models for routine implementation and ordinary debugging. Reserve stronger models for genuinely hard diagnosis, long-horizon reasoning, subtle judgment, or costly mistakes. If several models are adequate, prefer availability and lower expected cost; for an ongoing session include the cost of losing its cache. Do not infer provider superiority from its name.

For overlapping choices, TypeSafe recommends structured criteria containing what an option covers, what belongs to a neighboring option, and example inputs [3]. Avoid five vague slogans such as “cheap,” “smart,” and “fast.”

## Confidence and provider budget

Jev's Choice confidence summarizes concentration of the routing distribution, not the chosen coding model's probability of completing the task [4]. When both Haiku and Luna are suitable, split probability can reflect two adequate choices, not a need for Opus. Adding options also changes the interpretation of a fixed confidence threshold; current thresholds should not be transplanted unexamined into a five-model choice.

Adding near-substitute candidates without revisiting the current confidence gates risks spurious fallback to expensive routes. If distinction among suitable small models is the problem, code can break ties using provider availability/budget and measured cost rather than requiring Jev to assert a universal winner. Capability-class selection followed by a deterministic provider tie-break is one possible later design, not implemented here. Do not invent subscription quota consumption from API $/token metadata: Codex/Claude subscription budgets are a separate input.

For an existing session, preserve its transcript and completed tool results when failing over; model choice and provider exhaustion are separate decisions. Cache considerations should not prevent a fresh independent subagent from using an appropriate cheaper model.

## Suggested later validation — not performed

Use a bounded set of representative real assignments with explicit acceptance criteria. Measure first-pass success, accepted-result time, total tokens/cost, retries/escalations, and user correction rate. Compare equivalent tool permissions and reasoning budgets. Optimize expected cost/time **per accepted task**, not just token price or tokens/second. Public benchmark scores should initialize the policy, not substitute for this evidence.

## Sources

1. SWE-bench owner documentation: https://www.swebench.com/SWE-bench/ (accessed 2026-10-08).
2. Terminal-Bench owner source: https://github.com/laude-institute/terminal-bench and https://www.tbench.ai/ (accessed 2026-10-08). Exact leaderboard versions must be recorded; the legacy README is not a current model leaderboard.
3. TypeSafe Choice, structured instructions and criteria: https://docs.typesafe.ai/primitives/choice.md (accessed 2026-10-08).
4. TypeSafe Confidence: https://docs.typesafe.ai/confidence.md (accessed 2026-10-08). State and composition guidance: https://docs.typesafe.ai/concepts/state.md and https://docs.typesafe.ai/concepts/how-to-build-with-system-one.md.
5. Cognition FrontierCode 1.1 Main leaderboard: https://cognition.com/frontiercode and https://www.cognition.ai/blog/frontier-code-1.1 (accessed 2026-10-08). The primary directly inspected rendered rows, table headings, and harness metadata; detailed settings/caveats and other provider/independent sources are in the companion reports.
