# Claude 5.5 benchmarks and routing criteria

**Researched: 2026-10-08 (UTC). Research only; no routing or configuration changes.** All source links below were accessed on that date. Numbers are published observations, not measurements performed in Pi or Jev.

## Identity verification first

All three requested models are verifiable in official Anthropic releases and current model documentation. **No older-model substitution or proxy model was needed.**

| Exact model | Official release date | Claude Platform API ID | Official release |
|---|---|---|---|
| Claude Opus 5.5 | 2026-09-22 | `claude-opus-5-5` | [Opus announcement][O] |
| Claude Sonnet 5.5 | 2026-09-28 | `claude-sonnet-5-5` | [Sonnet announcement][S] |
| Claude Haiku 5.5 | 2026-10-07 | `claude-haiku-5-5` | [Haiku announcement][H] |

The [official overview][D] independently lists these IDs and their capabilities; the [newsroom][N] lists the releases. Haiku was released yesterday relative to this research date. Sonnet's September announcement says Haiku will follow; the October Haiku announcement supersedes that future-tense statement.

**Identity limits:** verification covers publicly documented model IDs, not an authenticated account's availability, immutable backend snapshots, or Pi/Jev's installed model registry. No API/model calls were made. Benchmark deployments can include safety-triggered fallback models, so their scores are not always scores of the named weights alone.

## Bottom line

- **Haiku:** candidate for narrow, high-volume extraction, lookups, compaction, classification and routing—not a cheap substitute for complex autonomous coding. Its speed and low token prices are real published evidence; task-specific routing accuracy is not established.
- **Sonnet:** candidate for well-scoped coding and everyday tool work. Strong coding scores do not establish that it is better than Opus at sustained, ambiguous judgment.
- **Opus:** candidate for complex coding, long-context reconstruction and judgment-heavy work. **It can also be cheaper per coding task:** Cognition reports Opus medium at $0.80/rollout versus Sonnet xhigh at $1.59 and Haiku max at $1.33 on FrontierCode Main.
- **Effort is part of the route.** Sonnet max is worse than xhigh on FrontierCode; Opus medium is its best observed FrontierCode setting. Token price alone is an inadequate routing rule.

These are **inferred routing recommendations**, not benchmark-proven Pi/Jev policies.

## Concise capability/routing matrix

| Dimension | Haiku 5.5 | Sonnet 5.5 | Opus 5.5 |
|---|---|---|---|
| Candidate Pi subagent role (inference) | Read-only search/extraction; summaries; compaction; very narrow code work with checkable outputs | Bounded implementation, bug fixes, scoped reviews, routine tool workflows | Ambiguous investigations, multi-repository changes, difficult review, long-horizon work |
| Candidate Jev routing criterion (inference) | Inputs and answer criteria explicit; short decision/label or factual extraction; cheap correction possible | Clear acceptance criteria but meaningful implementation/tool sequencing needed | Conflicting evidence, unclear requirements, many dependencies, expensive mistakes/retries |
| FrontierCode 1.1 Main, best observed effort (Cognition) | 46.4%, max | 52.1%, xhigh | 54.6%, medium |
| Terminal-Bench 4.0 (Anthropic; mixed effort/fallback conditions) | 39.2%, max | 70.6%, max | 66.4%, xhigh |
| HLE with tools (Anthropic, max) | 57.4% | 64.5% | 67.7% |
| Toolathlon-Verified pass@1 (Anthropic, max) | Not found in inspected card | 77.8% | 77.8% |
| Independent output speed, AA default workload | 243.4 standardized tokens/s | 129.1 standardized tokens/s | 95.3 standardized tokens/s |
| API default effort / possible starting point | Medium; low is a cost-driven hypothesis | High; low/medium are cost-driven hypotheses for easier work | Medium, directly supported on FrontierCode |
| Context / maximum output (official docs) | 1M / 128K tokens | 1M / 128K tokens | 1M / 128K tokens |
| Principal caveat | Max effort can consume many tokens; prices rise 5× above 100K prompt tokens | Max does not monotonically improve coding; half Opus's token price is not half its task cost | Not universally superior on every benchmark; fallbacks and harness affect results |

Sources and settings: [cards][HC], [Sonnet card][SC], [Opus card][OC], [Cognition][F], [AA model pages][AH], [AS], [AO], [docs][D]. The routing rows are inference; benchmark rows retain their provenance rather than implying one common harness.

## Independent evidence observed directly

### Cognition: FrontierCode 1.1 Main

The live [benchmark-owner leaderboard][F] displayed the following on 2026-10-08. These are **Cognition-run**, not Anthropic-run scores, also reproduced in Anthropic's cards.

| Model and selected effort | Weighted rubric score | Blocking-criteria pass rate | Mean cost/rollout | Mean output tokens/rollout | Unfair-internet-use flag rate |
|---|---:|---:|---:|---:|---:|
| Opus 5.5 medium | 54.6% | 59.6% | $0.80 | 18.5K | 0.0% |
| Sonnet 5.5 xhigh | 52.1% | 57.2% | $1.59 | 47.4K | 0.0% |
| Haiku 5.5 max | 46.4% | 51.6% | $1.33 | 181.4K | — |

**Settings:** Main is the hardest 100 of 150 tasks; Extended is all 150. Each score averages five runs/task according to the cards. Repository maintainers author task briefs, test/style requirements and grading criteria. Agents work autonomously in containers with internet access; Claude runs use Claude Code. Weighted rubric score is **not** the blocking-criteria pass rate. Failing blocking criteria yields zero; v1.1 also zeroes runs consulting solution-bearing sources. Documentation and legitimate error-message searches remain allowed. The leaderboard selects each model's best-scoring reasoning effort, not a matched effort across models. [F][FM][HC §8.3][SC §8.4][OC §8.4]

**Effort caveat:** Sonnet scores 46.2% at max versus 52.1% at xhigh; Opus scores 54.4% at max versus 54.6% at medium. Anthropic's Sonnet release footnote explains that max more often ran a multi-subagent code-review skill; in two cases Cognition examined, this caused a timeout or extra out-of-scope edits. This is particularly relevant to Pi subagent scope discipline. It is not proof of a universal model-only instruction-following ranking. [S footnote 2]

**Cost caveat:** the dollar figures above are the leaderboard's displayed values, not independently recalculated invoices. The inspected page did not establish whether its Sonnet costing incorporates the October 7 cache-read price cut. Haiku's missing flag rate is not zero. No uncertainty interval was transcribed for these rows. Do not extrapolate the hard Main set to trivial lookups or assume Opus dominates every easier workload.

### Artificial Analysis: intelligence, speed and cost

Direct [AA pages][AH][AS][AO], accessed 2026-10-08:

| AA model variant | Intelligence Index v4.3.2 | Weighted cost/Index task | Output speed |
|---|---:|---:|---:|
| Haiku 5.5 **max** | 43 | $0.21 | 243.4 tokens/s |
| Sonnet 5.5 **max, default fallback** | 56 | $5.46 | 129.1 tokens/s |
| Opus 5.5 **max, default fallback** | 58 | $5.98 | 95.3 tokens/s |

“Default fallback” describes the fallback policy, **not default reasoning effort**: the page titles explicitly say Max. These are independently published AA measurements. The index combines ten evaluations: AA-Briefcase v1.1, GDPval-AA v2.1, AutomationBench-AA, Terminal-Bench 4.0, SciCode, HLE, GDP.pdf, CritPt, AA-Omniscience and AA-LCR v1.1. Category weights are Agents 30%, Coding 20%, Scientific Reasoning 20%, General 30%. It is primarily English/text-based, not a routing classifier accuracy score. [AI]

**AA intelligence settings:** generally temperature 0.6 for reasoning models unless the lab recommends otherwise, maximum allowed reasoning-model output, generally pass@1 aggregated over repeats. AA's Terminal-Bench implementation uses **mini-swe-agent**, 66 tasks × three repeats, maximum 500 agent steps, upstream resource/time limits, native bash and the full transcript with **no compaction/summarization**. This differs from Anthropic's Claude Code results below. [AI]

**Speed settings:** default workload is approximately 10K input tokens and at least 1,500 answer tokens; single-prompt measurements are normally P50 over the previous 72 hours, with the 1K/10K/vision workloads tested eight times/day. AA tests from GCP `us-central1-a`, uses standardized `o200k_base` token counting for speed, and for reasoning models that hide some reasoning measures the last 80% of answer chunks. General parameters are temperature 0.6 for reasoning models unless otherwise recommended, `top_p: 1`. Prices/Index costs instead use provider-reported tokens. [AP]

**Latency limits:** output throughput excludes time before generation and does not measure agent completion latency. AA distinguishes TTFT from time to first **answer** token, which includes thinking. Numeric TTFT/first-answer values were not available in the text inspected; none are invented here. Haiku is only one day old, so the nominal 72-hour window cannot constitute three days of post-release history. Tool execution, turns, queueing, concurrency and prompt length can change the ranking. The AA cost figures are a weighted benchmark workload, not the cost of a Pi/Jev decision.

## Provider-reported capability evidence

These scores were read from official release tables and system cards. Except where explicitly attributed to an external evaluator, **Anthropic ran/reported them**. External benchmark authorship alone does not make a provider's run independent.

| Evaluation / metric | Haiku 5.5 | Sonnet 5.5 | Opus 5.5 | Provenance / conditions |
|---|---:|---:|---:|---|
| SWE-bench Pro | 64.8% | 81.3% | 89.9% | Anthropic cards; adaptive thinking max, five trials |
| SWE-bench Multilingual | 83.7% | 90.3% | 93.9% | Anthropic; 300 problems, nine languages, five trials |
| SWE-bench Multimodal | 30.7% | 54.3% | 61.4% | Anthropic; visual issue context, five trials |
| Terminal-Bench 4.0 | 39.2% | 70.6% | 66.4% | Anthropic; detailed differences below |
| HLE, **no tools** | 45.9% | 56.9% | 64.4% | Anthropic; max, not comparable to tools scores |
| HLE, **with tools** | 57.4% | 64.5% | 67.7% | Anthropic; tools/budgets below |
| ProgramBench hidden behavioral-test pass rate | 82.0% | 79.7% | 91.2% | Anthropic modified task selection/time limit; not percentage of wholly solved tasks |
| OSWorld 2.1 **offline 82-task subset**, partial credit | 72.4% | 83.9% | 87.2% | Anthropic reruns in Haiku card, max |
| Same OSWorld subset, **strict** pass rate | 37.1% | 48.8% | 53.2% | All checkpoints must pass |
| Toolathlon-Verified pass@1 | Not found | 77.8% | 77.8% | Anthropic internal harness, max, three runs × 108 tasks |

Sources: [HC §§8.1–8.9], [SC §§8.1–8.14], [OC §§8.1–8.14]. SWE variant dataset references are the author papers linked from the cards, including [SWE-bench Pro][SWP] and [Multimodal][SWM]. The cards' short SWE summaries do not provide a complete version-pinned, reproducible harness specification; do not relabel these as SWE-bench Verified or combine them with an unrelated public leaderboard.

### Published settings and comparability traps

**Terminal-Bench 4.0:** 66 containerized terminal tasks; Claude Code `--bare`. Haiku max: ten trials/task (660), SE ±1.9 points; Sonnet max: five/task (330), SE ±2.5; Opus xhigh: five/task (330), SE ±2.6. Opus max is 64.8%, within reported noise of xhigh. These are **standard errors**, not 95% confidence intervals. Sonnet and Haiku had no internet egress, with historically required resources pre-cached. Anthropic says the restriction could lower scores and Haiku's effect was not rigorously measured. Haiku had no fallback: 12/660 trials (1.8%) stopped on safeguards and failed. Sonnet fallbacks affected 1.5% of trials (1.2% of requests flagged); Opus fallbacks affected 10% of trials (2.5% of requests flagged). Sonnet's 4.2-point lead over Opus is not a clean universal quality ordering, given uncertainty, effort and system differences. Version 4.0 changes timeouts/resources; older Terminal-Bench scores are not interchangeable. [HC §8.4][SC §8.5][OC §8.5][TB]

**HLE:** 2,500 multimodal expert questions. Tools variant uses web search, web fetch, programmatic tool calling and code execution; no context compaction; thinking `auto`; Opus 4.6 grades answers. Haiku/Sonnet use 980K-token task budgets; Opus's card specifies a 1M-token total across contexts. HLE-related sources are blocklisted, correctly answered transcripts are screened and confirmed contamination is marked incorrect. Standard card configuration is max effort/five trials unless overridden. Cost charts assume perfect cache hits for Opus/Sonnet but recorded list-price usage for Haiku, and exclude web-search fees; do not treat them as matched billing experiments. [HC §8.8.1][SC §8.11.1][OC §8.11.1]

**Long context:** all three expose 1M context/128K output, but equal capacity does not imply equal recall or reasoning quality. ProgramBench reconstructs programs from binaries/docs without internet or decompilers. Anthropic excludes 34/200 tasks whose reference binary scored below 0.9, scores only tests the reference passes on the remaining 166, and removes the upstream six-hour limit using mini-swe-agent. The reported metric is hidden-test pass rate. Haiku's 82.0% beating Sonnet's 79.7% on this setup is an exception to a simple tier ranking, not proof Haiku handles every long-context workload better. [D][HC §8.7.1][SC §8.10.1][OC §8.10.1]

**Computer use:** the Haiku card re-evaluates all three on the official 82/108 offline subset at max: 1080p screenshots, maximum 500 action steps, five attempts/task, Opus 4.8 for model-graded tasks. Use the matched 72.4/83.9/87.2 partial and 37.1/48.8/53.2 strict figures above. Do **not** mix these with release-time full-set Sonnet 80.1/Opus 81.8 partial scores. The Opus summary table itself labels the earlier result OSWorld 2.0, while release text labels it 2.1; the Haiku card explains 2.1 is the corrected release of 2.0. Preserve subset/version labels. [HC §8.9.3]

**Tool use:** Toolathlon-Verified exposes 600+ tools across 32 apps with execution-based checking. At max, Sonnet's pass@3 is 85.2%, all-three-correct (`Pass³`) 68.5%, average turns 31.6; Opus is 82.4%, 72.2%, 26.9. Equal pass@1 therefore conceals consistency/turn-count differences. Sonnet counts two safety stops as failures; Opus counts one safety stop and six sandbox-monitor stops as failures. Anthropic applies environment patches, pins financial data/container images, and discusses discrepancies caused by upstream null trajectories counted as failures. These are not directly interchangeable with the authors' leaderboard. No Haiku Toolathlon number was found. [SC §8.14.5][OC §8.14.5]

**Instruction following:** no directly observed, comparable three-model IFBench/IFEval score was recovered. AA documents standalone IFBench (294 single-turn prompts, five repeats, official AllenAI evaluator, **loose** prompt-level scoring); it is **not** in Index v4.3.2. Thus Index scores cannot stand in for strict format compliance. FrontierCode offers scope/codebase-adherence evidence but not a general instruction-following score. Anthropic's Opus card also records remaining unverified inference/false-completion and instruction-following problems in internal use; stronger capability does not eliminate these. [AI, IFBench section][OC §2.3.3]

### Independently run scores quoted by Anthropic, not directly re-observed numerically

| Evaluation | Haiku max | Sonnet max | Opus max | Attribution / date caveat |
|---|---:|---:|---:|---|
| GDPval-AA v2.1 Elo | 1620 | 1840 | 1846 | AA-run; Haiku card/current comparison; Opus release/card |
| AA-Briefcase v1.1 Elo | 1578 | 1824 | 1822 | AA-run; Haiku card/current comparison; Opus card |

These are **external-evaluator results as quoted by Anthropic**, not independent numeric confirmations made in this research. The Sonnet release/card earlier lists GDPval 1844 and Briefcase 1811. Do not silently average or replace those dated values: live Elo results can move, and the inspected sources do not fully reconcile the revisions. Anthropic also reports a fixed pre-release structured-output deployment bug which could have understated Sonnet's original results. GDPval-AA uses 220 tasks spanning 44 occupations; AA-Briefcase evaluates complex linked knowledge work. [HC §§8.10.2–3][SC §§8.14.3–4][S footnote 3][OC §§8.14.3–4]

For Haiku **medium**, the card quotes GDPval-AA **1277 Elo** using about one-tenth of its max output tokens, and AA-Briefcase **1372 Elo** using under one-quarter. These substantiate a cost/quality tradeoff, not a validated routing-classification accuracy. [HC §§8.10.2–3]

## Cost, context and latency facts

Current official USD per million tokens, **as of October 8**, from [pricing docs][P]:

| Model / prompt band | Uncached input | Output | Cache hit | 5-minute cache write | 1-hour cache write |
|---|---:|---:|---:|---:|---:|
| Haiku, ≤100K prompt tokens | $0.10 | $0.50 | $0.01 | $0.125 | $0.20 |
| Haiku, >100K prompt tokens | $0.50 | $2.50 | $0.05 | $0.625 | $1.00 |
| Sonnet | $2.00 | $10.00 | $0.10 | $2.50 | $4.00 |
| Opus | $4.00 | $20.00 | $0.20 | $5.00 | $8.00 |

The Haiku threshold is a **prompt pricing band**, not its context limit. Sonnet cache hits fell from $0.20 to $0.10 on October 7; the September release pricing is stale on this point. Haiku's announcement estimates about 75% lower task cost than **Haiku 4.5**, considering traffic distribution and an updated tokenizer; that is not a measured 75% reduction versus Sonnet/Opus. Sonnet and Opus claim 30%+ faster output than their respective **version 5 predecessors**, not 30% relative to each other. [H][S][O]

Anthropic calls Haiku the fastest standard-speed model but explicitly says Opus **Fast Mode** can be faster. Opus Fast Mode advertises up to 2.5× speed at $8 input/$40 output per million tokens. AA's standard-speed measurements must not be mixed with that mode. App/Claude Code defaults can also differ from API defaults: Sonnet's announcement says medium in apps/Claude Code versus high on the Platform. Opus cannot disable thinking; Sonnet's migration guidance uses `between_tools` when moving from thinking-off. These are integration considerations, not changes made here. [H footnote 1][O][S][D]

## Routing implications for Pi subagents and Jev — inference only

1. **Route by task ambiguity, checkability and expected total work, not label or token price.** A narrow retrieval/classification with explicit answer criteria is a Haiku candidate; autonomous multi-file implementation is not automatically one. Anthropic explicitly positions Haiku for narrow subagent work and says Sonnet/Opus remain better for complex agentic coding. [H]
2. **For coding shaped like FrontierCode Main, Opus medium has the strongest directly observed score/cost combination among these three.** Do not force it through a cheaper-looking Haiku or Sonnet tier first merely because their tokens cost less. Cognition's result does not prove this for every routine task. [F]
3. **Sonnet is a bounded-work candidate, not a demonstrated universal cheapest default.** Start from its documented API high effort if no task evidence says otherwise; medium/low for easy tasks are tentative cost-driven choices, supported qualitatively by Anthropic's effort curves but not by Pi/Jev measurements. Its best FrontierCode effort is xhigh, not max. [S][D]
4. **Haiku medium is a reasonable hypothesis for short, high-volume decisions, summaries and extraction.** Its documented default and token/speed advantage support trying that role; max effort evidence cannot guarantee medium's reliability. Repeated uncertain lookups, missing evidence, ambiguous scope or failed checkable outputs are reasons to choose Sonnet/Opus instead. No numerical confidence threshold is justified by these sources.
5. **Use Opus for expensive-to-correct reasoning and long-horizon context synthesis.** Its HLE/SWE/ProgramBench evidence supports this relative to the other two, while Terminal-Bench and Toolathlon show why there is no universally best model. Higher effort is not automatically necessary or better.
6. **Jev-specific distinction:** this research does not assume Jev is one of these Claude models or that Jev's calibrated typed judgments map to Claude benchmark scores. These results can inform downstream model selection or Claude-based routing candidates, but establish neither Jev probability calibration nor routing accuracy. No Jev/Pi routing implementation or registry was inspected or changed.

A numerical policy would require model × effort × actual harness comparisons on the user's task distribution: success, scope/format compliance, retries, wall time, cache hits, input band and billed cost. **That is a missing evidence requirement, not an experiment run or implementation requested here.**

## Gaps, risks and collection limits

- **No major model-name/release gap:** all requested identities verified. Remaining identity gaps are immutable deployment/snapshot details and local integration availability.
- No direct Pi/Jev benchmark, strict instruction-following comparison, numeric TTFT table, calibrated routing threshold, or matched-effort end-to-end latency comparison was observed.
- Coding benchmarks evaluate **model + agent harness + tools + prompts + resources + safeguards**. Claude Code, mini-swe-agent and Pi cannot be assumed equivalent. Safety fallbacks can serve older models within a named 5.5 run; older fallback identities here are explicitly deployment caveats, not substituted models.
- Exact CLI versions, complete prompts/resources and uncertainty are not uniformly published in the inspected summaries. Figures only shown graphically were not eyeballed into invented numbers. Provider-hosted customer testimonials are not treated as independently verified controlled benchmarks.
- Web search failed once with an OpenAI HTTP 400 unsupported-reasoning-setting error; it was not retried. Google browser search hit a challenge. Research recovered through native browser official pages and `curl`, including primary benchmark-owner pages; system-card PDFs were text-extracted locally with the installed PDFKit framework. No installs, model invocations, tests or commits.

## Primary-source register

Release dates below are publication dates; all links accessed **2026-10-08**. Documentation and leaderboard figures are access-date snapshots when no stable publication date is supplied.

- [O] Anthropic, **2026-09-22**, [Introducing Claude Opus 5.5](https://www.anthropic.com/claude-opus-5-5).
- [S] Anthropic, **2026-09-28**, [Introducing Claude Sonnet 5.5](https://www.anthropic.com/claude-sonnet-5-5).
- [H] Anthropic, **2026-10-07**, [Introducing Claude Haiku 5.5](https://www.anthropic.com/claude-haiku-5-5).
- [N] Anthropic, [Newsroom](https://www.anthropic.com/news), live release listing.
- [OC] Anthropic, [Opus 5.5 System Card](https://www.anthropic.com/claude-opus-5-5-system-card), release-linked PDF; especially §§2.3.3, 8.1–8.14.
- [SC] Anthropic, [Sonnet 5.5 System Card](https://www.anthropic.com/claude-sonnet-5-5-system-card), release-linked PDF; especially §§8.1–8.14.
- [HC] Anthropic, [Haiku 5.5 System Card](https://www.anthropic.com/claude-haiku-5-5-system-card), release-linked PDF; especially §§8.1–8.10.
- [D] Anthropic, [Models overview](https://platform.claude.com/docs/en/models/overview), live IDs/specifications/defaults.
- [P] Anthropic, [Pricing](https://platform.claude.com/docs/en/about-claude/pricing), live price table.
- [F] Cognition, [FrontierCode leaderboard](https://cognition.com/frontiercode), live v1.1 Main, best-effort rows; changelog confirms Haiku added **2026-10-07**.
- [FM] Cognition, **2026-07-07** (leaderboard revision date), [FrontierCode 1.1 methodology](https://www.cognition.ai/blog/frontier-code-1.1).
- [TB] Terminal-Bench owners, [Terminal-Bench 4.0](https://www.tbench.ai), benchmark landing page; numeric comparison here comes from Anthropic, not a transcribed owner leaderboard.
- [AH] Artificial Analysis, [Haiku 5.5 max](https://artificialanalysis.ai/models/claude-haiku-5-5), live model analysis.
- [AS] Artificial Analysis, [Sonnet 5.5 max/default fallback](https://artificialanalysis.ai/models/claude-sonnet-5-5), live model analysis.
- [AO] Artificial Analysis, [Opus 5.5 max/default fallback](https://artificialanalysis.ai/models/claude-opus-5-5), live model analysis.
- [AI] Artificial Analysis, [Intelligence methodology](https://artificialanalysis.ai/methodology/intelligence-benchmarking), v4.3.2 and individual evaluation protocols, including standalone IFBench.
- [AP] Artificial Analysis, [API performance methodology](https://artificialanalysis.ai/methodology/performance-benchmarking), includes version 2.2.0 changes dated **2026-03-02**.
- [SWP] Benchmark authors, **2025**, [SWE-bench Pro paper](https://arxiv.org/abs/2509.16941), author reference linked from the cards; provider runs above are not independent owner scores.
- [SWM] Benchmark authors, **2024**, [SWE-bench Multimodal paper](https://arxiv.org/abs/2410.03859), author reference linked from the cards; same provenance caveat.

[O]: https://www.anthropic.com/claude-opus-5-5
[S]: https://www.anthropic.com/claude-sonnet-5-5
[H]: https://www.anthropic.com/claude-haiku-5-5
[N]: https://www.anthropic.com/news
[OC]: https://www.anthropic.com/claude-opus-5-5-system-card
[SC]: https://www.anthropic.com/claude-sonnet-5-5-system-card
[HC]: https://www.anthropic.com/claude-haiku-5-5-system-card
[D]: https://platform.claude.com/docs/en/models/overview
[P]: https://platform.claude.com/docs/en/about-claude/pricing
[F]: https://cognition.com/frontiercode
[FM]: https://www.cognition.ai/blog/frontier-code-1.1
[TB]: https://www.tbench.ai
[AH]: https://artificialanalysis.ai/models/claude-haiku-5-5
[AS]: https://artificialanalysis.ai/models/claude-sonnet-5-5
[AO]: https://artificialanalysis.ai/models/claude-opus-5-5
[AI]: https://artificialanalysis.ai/methodology/intelligence-benchmarking
[AP]: https://artificialanalysis.ai/methodology/performance-benchmarking
[SWP]: https://arxiv.org/abs/2509.16941
[SWM]: https://arxiv.org/abs/2410.03859
