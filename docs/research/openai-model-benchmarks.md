# OpenAI coding-model routing evidence

Research date: 2026-10-08. Research only; no provider calls, benchmark runs, or routing/configuration changes.

## Bottom line

OpenAI officially documents GPT-6 Luna (`gpt-6-luna`) and GPT-6.1 Sol (`gpt-6.1-sol`). The installed p3 router and personal Auto extension configure those exact IDs under `openai-codex`; the older research checkout still names `gpt-6-sol`. No provider request was made to verify the actual served backend.

The initial delegated research found only qualitative model positioning in accessible OpenAI docs. **Follow-up primary research found independent coding results for both models on Cognition's live FrontierCode leaderboard.** These supersede the initial statement that no coding comparison was recovered. Both use the Codex harness, but their displayed efforts differ. They do not measure Pi performance or establish a small-task routing threshold.

## Independent coding evidence: FrontierCode 1.1 Main

Read directly from the rendered [Cognition leaderboard][F] on 2026-10-08. Table headings and model-cell harness metadata were inspected, not inferred from model names.

| Model | Displayed best effort | Weighted rubric score | Blocking-criteria pass rate | Unfair-internet-use flag rate | Displayed cost/rollout | Output tokens/rollout | Harness |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| GPT-6.1 Sol | medium | 50.2% | 55.8% | 0.4% | $0.36 | 11.4K | Codex |
| GPT-6 Sol (older route) | max | 49.3% | 54.3% | 0.0% | $2.07 | 41.3K | Codex |
| GPT-6 Luna | max | 42.4% | 47.8% | 0.0% | $0.10 | 56.6K | Codex |

Main is the hardest 100 of 150 tasks; see the companion Claude report and [owner methodology][FM]. The leaderboard explains that each row selects the model's best-scoring reasoning effort on Main. Its score combines correctness, test quality, scope discipline, style, and codebase standards. Runs consulting solution-bearing internet sources are flagged and scored zero. Score is not the blocking pass rate, and cost/rollout is not cost/success or subscription quota consumption. No uncertainty intervals were captured for these rows.

**Defensible inference:** Luna trades lower displayed cost for lower performance on this difficult coding workload. Sol 6.1 medium has a substantially better displayed score and much less output than older Sol max, so “always turn effort up” is not a sound rule. Luna's max-effort result is not a measurement of the installed Luna-high route, and neither result establishes quality on trivial extraction or exact edits.

**Cross-provider caveat:** Claude entries on this leaderboard use Claude Code, while OpenAI entries use Codex. Shared tasks/scoring allow useful system-level comparison but not a controlled model-only comparison. The Claude companion report records Opus 5.5 medium at 54.6%/$0.80, Sonnet 5.5 xhigh at 52.1%/$1.59, and Haiku 5.5 max at 46.4%/$1.33. Do not translate these into a universal Haiku-versus-Luna or Sonnet-versus-Sol ordering.

## Provider documentation

| Dimension | GPT-6 Luna | GPT-6.1 Sol | Routing implication |
| --- | --- | --- | --- |
| Intended work | “Most efficient” for focused, high-volume tasks | Complex coding, computer use, professional work; “near-Astra performance” at lower cost | Provider positioning supports trialing Luna on bounded low-consequence work and Sol on demanding work; it is not a local quality guarantee |
| Reasoning effort | `none`, `low`, `medium` default, `high`, `xhigh`, `max` | `low`, `medium` default, `high`, `xhigh`, `max`; no `none`/`minimal` | Record the model/effort pair; equal labels do not imply equal compute |
| Tool use | Responses supports built-in tools/function calling; Chat Completions function calling only with `none` | Responses supports tools; Chat Completions documented without tool calling | Compare the actual Responses/Codex agent path, not incompatible API modes |
| Public API context/output | 1,050,000 / 128,000 tokens | 1,050,000 / 128,000 tokens | Equal capacity does not prove equal long-context accuracy |
| Public API input/output price per 1M tokens | $0.10 / $0.50; cached input $0.01 | $2.00 / $10.00; cached input $0.10 | Luna uncached token rates are 20× lower, not necessarily task cost or subscription usage |
| Speed label | Fast | Fast | Qualitative provider label; not comparable task-latency measurements |

Sources: [Luna page][L], [Sol page][S], [catalog][M], [guide][G]. The primary independently re-fetched the two model pages and confirmed the listed descriptions, limits, efforts, and pricing. OpenAI's announcement page encountered a Cloudflare challenge; no announcement-only score is relied on.

**Local-provider distinction:** inspected custom catalog fields give Codex Luna a 272,000-token context, not the public API's 1,050,000. Use actual provider eligibility/context and subscription-budget information. Local metadata is not an independently verified quota formula. Account availability was not tested.

## Initial routing hypotheses for Jev

- **Luna trial assignments:** exact extraction, locating known symbols, listing callers, summarizing supplied evidence, and very narrow edits with explicit instructions and cheap independent acceptance checks. The edit proposal would change p3's existing no-Luna-implementation policy; it is not a benchmark finding. Escalate on a failed acceptance check rather than restarting an open-ended investigation on a small model.
- **Sol assignments:** meaningful multi-step implementation, ordinary refactors, integration work, planning with tradeoffs, and investigation requiring synthesis or diagnosis. The FrontierCode evidence supports Sol over Luna on demanding autonomous coding under Codex, not every conceivable task.
- Select by ambiguity, task horizon, verification difficulty, and failure consequences. Short text or few changed lines does not imply a simple task. Do not equate “research” with extraction when the assignment requires source assessment and a recommendation.
- Provider health/quota, authentication, explicit model requests, context fit, and input modality should remain deterministic eligibility constraints. Jev judges semantic fit among eligible options.
- Prefer expected cost/time per accepted task once measured, not token price alone. An inexpensive failed attempt plus escalation can exceed a direct stronger attempt. Subscription quotas require their own accounting.

No numerical Jev threshold follows from these public scores. A later local comparison could freeze representative tasks, repository state, prompts, tools, retry policy, and acceptance rubric; record model/effort, success, scope compliance, retries, wall time, and quota/cost per success. That experiment was not requested or run.

## Sources and access limitations

All accessed 2026-10-08:

1. OpenAI model catalog: https://developers.openai.com/api/docs/models
2. Luna: https://developers.openai.com/api/docs/models/gpt-6-luna
3. Sol 6.1: https://developers.openai.com/api/docs/models/gpt-6.1-sol
4. GPT-6 guide: https://developers.openai.com/api/docs/guides/latest-model
5. Cognition FrontierCode live leaderboard: https://cognition.com/frontiercode
6. Cognition FrontierCode 1.1 methodology: https://www.cognition.ai/blog/frontier-code-1.1
7. SWE-bench owner documentation: https://www.swebench.com/SWE-bench/
8. Terminal-Bench owner source: https://github.com/laude-institute/terminal-bench
9. Installed local p3 `extensions/routing/policy.ts`, personal `extensions/auto.ts`, selected non-secret personal catalog fields. No credentials accessed.

The initial delegated researcher did not inspect local route configuration or discover the rendered FrontierCode OpenAI rows; the primary added both. The benchmark evidence is an access-date snapshot, not an immutable scored dataset copy. No claims are made about authenticated account availability, numeric TTFT, subscription limits, or Pi-specific quality.

[F]: https://cognition.com/frontiercode
[FM]: https://www.cognition.ai/blog/frontier-code-1.1
[L]: https://developers.openai.com/api/docs/models/gpt-6-luna
[S]: https://developers.openai.com/api/docs/models/gpt-6.1-sol
[M]: https://developers.openai.com/api/docs/models
[G]: https://developers.openai.com/api/docs/guides/latest-model
