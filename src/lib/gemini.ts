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
 *
 * The backstops deliberately span different model generations. When Google
 * sheds load it tends to 503 a whole generation at once, so a chain of
 * near-siblings just burns the time budget on the same overloaded pool.
 */
const CANDIDATES: Record<ModelTier, string[]> = {
  flash: [
    process.env.GEMINI_FLASH_MODEL,
    'gemini-flash-latest',
    'gemini-3.8-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
  ].filter((m): m is string => !!m),
  pro: [
    process.env.GEMINI_PRO_MODEL,
    'gemini-pro-latest',
    'gemini-3.1-pro-preview',
    'gemini-2.5-pro',
    'gemini-flash-latest',
    'gemini-3.8-flash',
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

/**
 * Thrown when the whole chain is exhausted (or the time budget runs out)
 * without a usable answer. Callers map this to a 503 + "try again" rather
 * than a generic 500, because nothing about the request was wrong.
 */
export class ModelsUnavailableError extends Error {
  readonly retryable = true;
  constructor(message: string) {
    super(message);
    this.name = 'ModelsUnavailableError';
  }
}

function isModelUnavailableError(err: any): boolean {
  const msg = String(err?.message || err);
  return /404/.test(msg) || /is not found|no longer available|not supported for generateContent/i.test(msg);
}

// 503 (overloaded), 429 (rate limited) and 500 are transient — Google is
// asking us to back off, not telling us the model is gone.
function isTransientError(err: any): boolean {
  const msg = String(err?.message || err);
  return /\[(429|500|503)\b/.test(msg) || /503|overloaded|high demand|Service Unavailable|rate limit/i.test(msg);
}

// Our own per-attempt timeout firing, not a Google-side failure.
function isAbortError(err: any): boolean {
  const name = String(err?.name || '');
  return /Abort/i.test(name) || /aborted|The operation was aborted/i.test(String(err?.message || ''));
}

/** Total wall-clock budget for one generate call, across every candidate. */
const DEFAULT_BUDGET_MS = 30_000;
/** Cap on any single HTTP attempt, so one hung call can't eat the budget. */
const DEFAULT_ATTEMPT_MS = 12_000;
/** Below this much remaining budget, starting another attempt is pointless. */
const MIN_ATTEMPT_MS = 3_000;
/** Backoff before retrying the SAME model — only used on the last candidate. */
const RETRY_DELAY_MS = 700;

export interface GenerateOptions {
  /** Wall-clock budget for the whole fallback walk. Keep it comfortably
   *  under the caller's serverless maxDuration so there is time left to
   *  serialize an error response. */
  budgetMs?: number;
  /** Per-attempt timeout. */
  attemptMs?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs a prompt against the given tier, walking the fallback chain on any
 * "model unavailable" or transient (overloaded/rate-limited) error.
 *
 * The walk is bounded by a wall-clock budget. This matters more than it
 * sounds: when Google is shedding load, every candidate 503s after several
 * seconds, and an unbounded chain-with-retries runs long enough for the
 * serverless function to be killed mid-flight. The caller then gets no
 * response at all — which surfaces in the browser as a bare network error
 * ("Load failed" in Safari) instead of a usable message. Bounding the walk
 * guarantees we always return something.
 *
 * On a transient error we move to the next candidate immediately rather than
 * retrying in place: different model IDs sit on different serving pools, so
 * the next candidate is a better bet than the same one again. Retrying the
 * same model is kept only for the last candidate, where there is nothing
 * else left to try.
 *
 * Throws ModelsUnavailableError if everything fails or the budget expires.
 * A non-availability error (bad prompt, auth) is surfaced immediately rather
 * than masked by a retry.
 */
export async function generateWithFallback(
  tier: ModelTier,
  prompt: string,
  options: GenerateOptions = {},
): Promise<string> {
  const budgetMs = options.budgetMs ?? DEFAULT_BUDGET_MS;
  const attemptMs = options.attemptMs ?? DEFAULT_ATTEMPT_MS;
  const deadline = Date.now() + budgetMs;
  const remaining = () => deadline - Date.now();

  const known = lastGoodModel[tier];
  const candidates = known
    ? [known, ...CANDIDATES[tier].filter((m) => m !== known)]
    : CANDIDATES[tier];

  let lastError: any;
  let budgetExhausted = false;

  for (let i = 0; i < candidates.length; i++) {
    const modelName = candidates[i];
    const isLastCandidate = i === candidates.length - 1;
    const model = getOrCreateModel(modelName);

    // Retry the same model only when there is no other candidate left.
    const maxAttempts = isLastCandidate ? 2 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (remaining() < MIN_ATTEMPT_MS) {
        budgetExhausted = true;
        break;
      }

      try {
        const result = await model.generateContent(prompt, {
          timeout: Math.min(attemptMs, remaining()),
        });
        lastGoodModel[tier] = modelName;
        return result.response.text();
      } catch (err: any) {
        lastError = err;

        if (isAbortError(err)) {
          console.warn(`Gemini model "${modelName}" (tier=${tier}) timed out after ${attemptMs}ms, moving on.`);
          if (lastGoodModel[tier] === modelName) delete lastGoodModel[tier];
          break;
        }

        if (!isModelUnavailableError(err) && !isTransientError(err)) throw err;

        if (isTransientError(err) && attempt < maxAttempts - 1 && remaining() > MIN_ATTEMPT_MS + RETRY_DELAY_MS) {
          console.warn(`Gemini model "${modelName}" (tier=${tier}) transient error, retrying in ${RETRY_DELAY_MS}ms:`, err.message);
          await sleep(RETRY_DELAY_MS);
          continue;
        }

        console.warn(`Gemini model "${modelName}" (tier=${tier}) unavailable, trying next candidate:`, err.message);
        if (lastGoodModel[tier] === modelName) delete lastGoodModel[tier];
        break;
      }
    }

    if (budgetExhausted) break;
  }

  const why = budgetExhausted
    ? `gave up after ${budgetMs}ms`
    : `all ${candidates.length} candidates failed`;

  throw new ModelsUnavailableError(
    `Gemini is unavailable right now (${tier} tier, ${why}). Please try again in a moment. Last error: ${lastError?.message ?? 'none'}`,
  );
}
