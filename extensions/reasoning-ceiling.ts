import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const exceedsHigh = (level: unknown) => level === "xhigh" || level === "max";

export default function (pi: ExtensionAPI) {
  let clamping = false;
  const clampSession = () => {
    if (clamping || !exceedsHigh(pi.getThinkingLevel())) return;
    clamping = true;
    try {
      pi.setThinkingLevel("high");
    } finally {
      clamping = false;
    }
  };

  pi.on("session_start", clampSession);
  pi.on("thinking_level_select", clampSession);
  pi.on("before_agent_start", clampSession);
  pi.on("before_provider_request", (event) => {
    clampSession();
    // Provider payloads have already been built by this point.
    if (!event.payload || typeof event.payload !== "object" || Array.isArray(event.payload)) return;
    const payload = event.payload as Record<string, unknown>;
    let replacement = payload;
    for (const key of ["reasoning", "output_config"]) {
      const value = payload[key];
      if (value && typeof value === "object" && !Array.isArray(value) && exceedsHigh((value as Record<string, unknown>).effort)) {
        replacement = { ...replacement, [key]: { ...value, effort: "high" } };
      }
    }
    if (exceedsHigh(payload.reasoning_effort)) replacement = { ...replacement, reasoning_effort: "high" };
    if (replacement !== payload) return replacement;
  });
}
