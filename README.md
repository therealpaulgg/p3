# p3

Paul's shareable [Pi](https://pi.dev) extensions, themes, and workflows.

## Install

```sh
pi install git:github.com/therealpaulgg/p3
```

To try it without adding it to your settings:

```sh
pi -e git:github.com/therealpaulgg/p3
```

## Included resources

- Advisor, model-routing, task-list, tutor-mode, and workflow extensions
- Direct claude.ai connector access and Telegram notification extensions
- Catppuccin, Dracula, Synthwave, and Matrix themes
- The `rpiv` workflow

The connector extension calls Anthropic's connector catalog and MCP proxy directly. It defaults to its own OAuth credential; run `/connectors-login` to authorize it, `/connectors-status` to inspect both available credential sources, and `/connectors-logout` to remove the direct credential. Use `/connectors-mode direct` or `/connectors-mode claude-code` to choose between the extension's credential and Claude Code's existing credential file. Both modes call the proxy directly; neither launches Claude Code. Direct credentials are stored at `~/.config/pi-claude-connectors/credentials.json` with mode `0600` and refreshed under a cross-process lock. This uses Anthropic's first-party OAuth client and undocumented connector endpoints, so it can change or be revoked without notice.

Peer agents use `message_agent` over per-pane Unix sockets, with Herdr's socket API resolving identities. Jev judges whether a new message warrants interrupting the recipient's current response; an already-running tool is allowed to finish. `message_agent` returns a message ID; `peer_message_status` reports queued, delivered, acknowledged (a turn finished after delivery), or superseded. Send `supersedes: <ID>` to replace your own outdated update. A message counts as delivered only once it appears in the recipient's conversation. If the user interrupts the recipient's turn with Escape, undelivered messages are held and attached to the user's next prompt instead of starting a turn; `peer_inbox` lists every message the recipient has received. Messages and receipts are in memory and do not survive a recipient Pi restart. Reload every participating peer after updating p3: the message socket protocol changed. Jev requires Pi 0.99.1 native classifier APIs and native TypeSafe authentication (`typesafe/jev-latest`, using Pi-managed credentials or `TYPESAFE_API_KEY`); p3 does not read a custom key file. Without native TypeSafe credentials or on a Jev failure, messages use ordinary after-turn delivery. Only short, secret-filtered message/task excerpts are sent to Jev.

For an optional, explicit merge approval, `grant_agent` records a user-confirmed grant scoped to one agent, repository, PR numbers, and an optional condition; `agent_grants` lets the recipient read it. Grants expire after 24 hours or a recipient Pi-session change and can be revoked. They are informational, not a merge guard: the recipient still checks live PR readiness. A grant is not required when the launching primary relays the user's in-scope decision.

The Telegram extension uses `~/.local/bin/pi-telegram-notify` to send notifications and poll for replies. Install the included helper with:

```sh
install -m 700 scripts/pi-telegram-notify ~/.local/bin/pi-telegram-notify
```

Telegram replies default to off. Run `/notify replies-on` or `/notify replies-off` to control them independently from notifications. When enabled in a private chat with the bot, reply to a notification within one hour to send that reply back to the Pi session that produced it. Replies must come from the user represented by the configured private chat ID; Telegram input is passed to Pi as literal text without slash-command or prompt-template expansion. The extension remains disabled when the helper is unavailable.

## Model routing and usage failover

The router considers Haiku 5.5, Sonnet 5.5, Opus 5.5, GPT-6 Luna, and GPT-6.1 Sol. Jev judges the required capability from ambiguity, dependency horizon, verification difficulty, and failure consequences; code selects an eligible provider/model. Exact, cheaply checkable edits may use small models. Ordinary UI or debugging work does not automatically require Opus. Without Jev, a conservative local policy applies.

Automatic subagents start on the selected route through `p3-failover/<route>`. Recognized provider usage exhaustion, or persistent rate limits/overload after Pi's retries, may cause one cross-provider switch per assignment. The transcript and completed tools are retained; only the failed assistant attempt is omitted from model context. Shared cooldowns prevent new automatic assignments repeatedly choosing the unavailable provider. Telemetry reports the physical model and effort actually dispatched. Explicit physical-model selections remain fixed.

The personal Auto loader registers `openai-codex/auto` using `extensions/routing/auto.ts`; it is not automatically enabled by the shareable package. Choose **Auto (sticky + failover)** in `/model` to retain the primary model already selected and enable provider failover. Auto does not ask Jev to downgrade or cost-optimize the ongoing primary conversation; task-based selection is for fresh subagents. A physical Opus default or a manual `/route` selection does not opt into failover.

Reasoning effort is capped at **High**, including manual selections and outgoing supported provider payloads. Above-High subagent overrides are rejected. Route defaults are Haiku/Opus/Sol Medium and Sonnet/Luna High. Reload Pi after updating these extensions or the model catalog.

## Experimental opt-in MCP Events

The [Pi 1.0.0 MCP Events reference slice](extensions/mcp-events/README.md) is not included in `pi.extensions` and does not auto-load with p3. Explicit per-session loading and source enrollment are required; model wake is a separate opt-in. It only admits the local synthetic reference server, not real third-party OAuth/subscriptions.

## Development

```sh
bun install --frozen-lockfile --ignore-scripts
./scripts/test-extensions.sh
```

Scoped MCP Events checks: `npm run typecheck:mcp-events`, `npm run test:mcp-events`, and `npm run test:mcp-events:timeout` (about 62 seconds).
