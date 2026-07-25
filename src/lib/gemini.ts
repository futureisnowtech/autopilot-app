import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type ModelTier = 'flash' | 'pro';

/**
 * Google retires dated model snapshots (gemini-1.5-*, then gemini-2.0-flash)
 * with little warning, and its own ListModels endpoint isn't a reliable
 * availability signal — it kept listing gemini-2.0-flash as supporting
 * generateContent after the model had actually been pulled. So instead of
 * pinning one model string, each tier is an ordered fallback chain: the
 * "-latest" aliases first (Google repoints these at whatever it currently
 * recommends, so they should survive most retirements without a code
 * change), then dated snapshots as a backstop. An env var lets ops pin an
 * exact model in an emergency without a redeploy.
 */
const CANDIDATES: Record<ModelTier, string[]> = {
  flash: [
    process.env.GEMINI_FLASH_MODEL,
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
  ].filter((m): m is string => !!m),
  pro: [
    process.env.GEMINI_PRO_MODEL,
    'gemini-pro-latest',
    'gemini-2.5-pro',
    'gemini-flash-latest',
  ].filter((m): m is string => !!m),
};

// Remember the last model that actually worked per tier so subsequent calls
// in this process skip straight to it instead of re-probing the chain.
const lastGoodModel: Partial<Record<ModelTier, string>> = {};

// Pre-warmed model cache — avoids re-instantiating GenerativeModel objects on
// every call, saving ~10-20ms per request from internal SDK setup.
const modelCache = new Map<string, ReturnType<typeof genAI.getGenerativeModel>>();

function getOrCreateModel(modelName: string) {
  let model = modelCache.get(modelName);
  if (!model) {
    model = genAI.getGenerativeModel({ model: modelName });
    modelCache.set(modelName, model);
  }
  return model;
}

function isModelUnavailableError(err: any): boolean {
  const msg = String(err?.message || err);
  return /404/.test(msg) || /is not found|no longer available|not supported for generateContent/i.test(msg);
}

/**
 * Runs a prompt against the given tier, walking the fallback chain on any
 * "model unavailable" style error. Throws only if every candidate fails, or
 * on a non-availability error (bad prompt, auth, quota) which is surfaced
 * immediately rather than masked by a retry.
 */
export async function generateWithFallback(tier: ModelTier, prompt: string): Promise<string> {
  const known = lastGoodModel[tier];
  const candidates = known
    ? [known, ...CANDIDATES[tier].filter((m) => m !== known)]
    : CANDIDATES[tier];

  let lastError: any;
  for (const modelName of candidates) {
    try {
      const model = getOrCreateModel(modelName);
      const result = await model.generateContent(prompt);
      lastGoodModel[tier] = modelName;
      return result.response.text();
    } catch (err: any) {
      lastError = err;
      if (!isModelUnavailableError(err)) throw err;
      console.warn(`Gemini model "${modelName}" (tier=${tier}) unavailable, trying next candidate:`, err.message);
      if (lastGoodModel[tier] === modelName) delete lastGoodModel[tier];
    }
  }

  throw new Error(`All Gemini ${tier} model candidates are unavailable. Last error: ${lastError?.message}`);
}
