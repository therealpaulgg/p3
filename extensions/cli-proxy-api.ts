import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { getBuiltinModels } from "@earendil-works/pi-ai/providers/all";
import type { ExtensionAPI, ProviderModelConfig } from "@earendil-works/pi-coding-agent";
import { parse } from "yaml";

type CatalogEntry = { id: string; owned_by?: string };
type ModelDetails = {
  name: string;
  displayName?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedInputModalities?: string[];
  supportedOutputModalities?: string[];
};

export default async function cliProxyAPI(pi: ExtensionAPI) {
  if (process.env.PI_OFFLINE === "1") return;
  const path = join(homedir(), ".config", "cli-proxy-api", "config.yaml");
  let config: { server?: { port?: number }; access?: { "api-keys"?: string[] } } | undefined;
  try {
    config = parse(readFileSync(path, "utf8"));
  } catch {
    return;
  }
  const key = config?.access?.["api-keys"]?.[0];
  const port = config?.server?.port ?? 8317;
  if (typeof key !== "string" || !key || !Number.isInteger(port) || port < 1 || port > 65535) return;

  const base = `http://127.0.0.1:${port}`;
  const openai = getBuiltinModels("openai");
  const claude = getBuiltinModels("anthropic");
  const gemini = getBuiltinModels("google");
  let models: ProviderModelConfig[] = [];

  async function discover(signal: AbortSignal) {
    const options = {
      headers: { Authorization: `Bearer ${key}` },
      redirect: "error" as const,
      signal: AbortSignal.any([signal, AbortSignal.timeout(1500)]),
    };
    async function fetchCatalog<T>(path: string): Promise<T> {
      const response = await fetch(`${base}${path}`, options);
      if (!response.ok) throw new Error(`CLIProxyAPI ${path}: ${response.status}`);
      return await response.json() as T;
    }
    const [catalog, metadata] = await Promise.all([
      fetchCatalog<{ data: CatalogEntry[] }>("/v1/models").catch(() => undefined),
      fetchCatalog<{ models: ModelDetails[] }>("/v1beta/models").catch(() => undefined),
    ]);
    if (!Array.isArray(catalog?.data) || signal.aborted) return models;
    const detailsById = new Map((metadata?.models ?? []).map((entry) => [entry.name.replace(/^models\//, ""), entry]));
    models = catalog.data.flatMap<ProviderModelConfig>(({ id, owned_by }) => {
      const details = detailsById.get(id);
      if (id.startsWith("gpt-image-") || (details?.supportedOutputModalities && !details.supportedOutputModalities.includes("text"))) return [];
      const known = owned_by === "openai" ? openai.find((model) => model.id === id)
        : owned_by === "anthropic" ? claude.find((model) => model.id === id)
        : owned_by === "antigravity" ? gemini.find((model) => model.id === id.replace(/-(?:xhigh|high|tiered)$/, ""))
        : undefined;
      return [{
        id,
        name: details?.displayName ?? known?.name ?? id,
        ...(owned_by === "anthropic" ? { api: "anthropic-messages", baseUrl: base }
          : owned_by === "openai" ? { api: "openai-responses" } : {}),
        reasoning: known?.reasoning ?? false,
        input: details?.supportedInputModalities ? (details.supportedInputModalities.includes("image") ? ["text", "image"] : ["text"]) : known?.input ?? ["text"],
        contextWindow: details?.inputTokenLimit ?? known?.contextWindow ?? 128000,
        maxTokens: details?.outputTokenLimit ?? known?.maxTokens ?? 16384,
        cost: known?.cost ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      }];
    });
    return models;
  }

  pi.registerProvider("cli-proxy", {
    name: "CLIProxyAPI",
    baseUrl: `${base}/v1`,
    apiKey: /^[!$]/.test(key) ? `$${key}` : key,
    api: "openai-completions",
    models: await discover(AbortSignal.timeout(1500)),
    async refreshModels({ allowNetwork, signal }) {
      return allowNetwork ? discover(signal) : models;
    },
  });
}
