import type { ExtensionContext } from "@earendil-works/pi-coding-agent";

/** Jev model for peer-message interruption; subagent routing uses the configurable classifier in classifier.ts. */
export async function getJevModel(ctx: ExtensionContext, signal: AbortSignal) {
  const models = await ctx.modelRegistry.getAvailableOfType("classifier", "typesafe", { signal });
  const jev = models.find((model) => model.provider === "typesafe" && model.id === "jev-latest");
  if (jev) return jev;
  const cloudflareModels = await ctx.modelRegistry.getAvailableOfType("classifier", "cloudflare-workers-ai", { signal });
  return cloudflareModels.find((model) => model.provider === "cloudflare-workers-ai" && model.id === "typesafe/jev");
}
