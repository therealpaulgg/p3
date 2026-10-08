import type { Api, Model } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { routeWithFailover, type FailoverState } from "./failover.ts";
import { routes, clampThinkingLevel, type ThinkingLevel } from "./policy.ts";

export default function (pi: ExtensionAPI) {
  let enteredFrom: { model: Model<Api>; thinkingLevel: ThinkingLevel } | undefined;

  pi.on("session_start", () => { enteredFrom = undefined; });
  pi.on("model_select", (event) => {
    enteredFrom = event.source !== "restore" && event.model.provider === "openai-codex" && event.model.id === "auto"
      && event.previousModel && event.previousModel.api !== "pi-virtual"
      ? { model: event.previousModel, thinkingLevel: clampThinkingLevel(pi.getThinkingLevel()) }
      : undefined;
  });

  pi.registerVirtualModel<FailoverState>({
    provider: "openai-codex",
    id: "auto",
    name: "Auto (sticky + failover)",
    thinkingLevels: ["off", "minimal", "low", "medium", "high"],
    route(request, ctx) {
      return routeWithFailover(request, ctx, () => {
        // Entering Auto preserves a manual selection even if that model has not answered yet.
        if (enteredFrom) {
          const selected = enteredFrom;
          if (request.reason !== "direct") enteredFrom = undefined;
          return selected;
        }
        const selected = request.state?.selected;
        if (selected) {
          const model = ctx.modelRegistry.find(selected.provider, selected.model);
          if (!model) throw new Error(`Auto's physical model is unavailable: ${selected.provider}/${selected.model}`);
          return { model, thinkingLevel: clampThinkingLevel(selected.thinkingLevel) };
        }
        if (request.previous) {
          return { model: request.previous.model, thinkingLevel: clampThinkingLevel(request.previous.thinkingLevel ?? request.thinkingLevel) };
        }
        const model = ctx.modelRegistry.find(routes.opus.provider, routes.opus.model);
        if (!model) throw new Error("Auto needs a physical starting model; select one before enabling Auto");
        return { model, thinkingLevel: clampThinkingLevel(request.thinkingLevel) };
      });
    },
  });
}
