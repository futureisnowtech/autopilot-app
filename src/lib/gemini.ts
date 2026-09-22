import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * How much model we want to spend on a call — NOT a Gemini product tier.
 *
 * Both levels resolve to flash-class models. We deliberately never call the
 * "pro" models: they are billed at a different rate and are the first thing
 * to get quota-capped, so a pro-tier chain meant paid users hit 429s and
 * silently degraded anyway. Paid plans get a more capable flash model rather
 * than a more expensive product line.
 */
export type ModelTier = 'standard' | 'better';

/**
 * Model ids rot. Google retires dated snapshots (gemini-1.5-*, then
 * gemini-2.0-flash, then the whole 2.5 generation) with little warning, and
 * ListModels is not a reliable availability signal — it kept advertising
 * models that 404 on generateContent.
 *
 * So the chains lead with the "-latest" ALIASES. Google repoints those at
 * whatever it currently recommends, which means a retirement is absorbed
 * without a code change or a redeploy. The dated ids are only a backstop for
 * the case where an alias itself misbehaves.
 *
 * Ordering is by cost: lite is the cheapest flash-class model, so 'standard'
 * leads with it. 'better' leads with full flash for a bit more capability at
 * still-low cost. Ops can override either list without a deploy.
 */
function chainFromEnv(name: string): string[] | null {
  const raw = process.env[name];
  if (!raw) return null;
  const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return ids.length ? ids : null;
}

const CANDIDATES: Record<ModelTier, string[]> = {
  standard: chainFromEnv('GEMINI_MODELS_STANDARD') ?? chainFromEnv('GEMINI_MODELS') ?? [
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
  ],
  better: chainFromEnv('GEMINI_MODELS_BETTER') ?? chainFromEnv('GEMINI_MODELS') ?? [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
  ],
};

// Remember the last model that actually worked per tier so subsequent calls
// in this process skip straight to it instead of re-probing the chain.
const lastGoodModel: Partial<Record<ModelTier, string>> = {};

/**
 * Models this process has seen 404 as retired. A retirement is permanent, so
 * there is no point paying the round trip again on every later request — and
 * skipping them keeps the time budget for candidates that might answer.
 */
const retiredModels = new Set<string>();

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
 * Thrown when the chain is exhausted or the time budget runs out.
 *
 * `message` is deliberately safe to show a user: provider names, model ids
 * and upstream URLs stay out of it. The technical detail lives on `detail`
 * for logs only — a raw Gemini error reaching the UI is both confusing and
 * an unnecessary disclosure of what we run on the backend.
 */
export class ModelsUnavailableError extends Error {
  readonly retryable = true;
  readonly detail: string;
  constructor(detail: string) {
    super("We couldn't get an answer just now. Please try again in a moment.");
    this.name = 'ModelsUnavailableError';
    this.detail = detail;
  }
}

function isRetiredModelError(err: any): boolean {
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

/**
 * When Google retires a model it names the replacement in the error body:
 * "This model models/X is no longer available... use models/Y instead".
 * Following that pointer lets the chain heal itself the moment a retirement
 * lands, instead of waiting for someone to notice and ship a new id.
 */
function suggestedReplacement(err: any): string | null {
  const msg = String(err?.message || err);
  const m = msg.match(/use\s+models\/([A-Za-z0-9.\-]+)/i);
  return m ? m[1] : null;
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
 * Runs a prompt against the given tier, walking a cost-ordered fallback chain.
 *
 * The walk is bounded by a wall-clock budget. This matters more than it
 * sounds: when Google sheds load, every candidate 503s after several seconds,
 * and an unbounded chain-with-retries runs long enough for the serverless
 * function to be killed mid-flight. The caller then gets no response at all —
 * which surfaces in the browser as a bare network error ("Load failed" in
 * Safari) instead of a usable message. Bounding the walk guarantees we always
 * return something.
 *
 * On a transient error we move to the next candidate immediately rather than
 * retrying in place: different model ids sit on different serving pools, so
 * the next candidate is a better bet than the same one again. Retrying the
 * same model is kept only for the last candidate, where nothing else is left.
 *
 * Throws ModelsUnavailableError — whose message is user-safe — if everything
 * fails or the budget expires. A non-availability error (bad prompt, auth) is
 * surfaced immediately rather than masked by a retry.
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
  const queue = (known
    ? [known, ...CANDIDATES[tier].filter((m) => m !== known)]
    : [...CANDIDATES[tier]]
  ).filter((m) => !retiredModels.has(m));

  const tried = new Set<string>();
  let lastError: any;
  let budgetExhausted = false;

  while (queue.length > 0) {
    const modelName = queue.shift()!;
    if (tried.has(modelName) || retiredModels.has(modelName)) continue;
    tried.add(modelName);

    // Retry the same model only when there is nothing else queued.
    const maxAttempts = queue.length === 0 ? 2 : 1;
    const model = getOrCreateModel(modelName);

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
          console.warn(`Gemini "${modelName}" (tier=${tier}) timed out after ${attemptMs}ms, moving on.`);
          if (lastGoodModel[tier] === modelName) delete lastGoodModel[tier];
          break;
        }

        if (!isRetiredModelError(err) && !isTransientError(err)) throw err;

        if (isTransientError(err) && attempt < maxAttempts - 1 && remaining() > MIN_ATTEMPT_MS + RETRY_DELAY_MS) {
          console.warn(`Gemini "${modelName}" (tier=${tier}) transient error, retrying in ${RETRY_DELAY_MS}ms:`, err.message);
          await sleep(RETRY_DELAY_MS);
          continue;
        }

        if (isRetiredModelError(err)) {
          // Permanent: never spend another round trip on it this process.
          retiredModels.add(modelName);
          const replacement = suggestedReplacement(err);
          if (replacement && !tried.has(replacement) && !retiredModels.has(replacement)) {
            console.warn(`Gemini "${modelName}" retired; following Google's suggested replacement "${replacement}".`);
            queue.unshift(replacement);
          } else {
            console.warn(`Gemini "${modelName}" (tier=${tier}) retired, trying next candidate:`, err.message);
          }
        } else {
          console.warn(`Gemini "${modelName}" (tier=${tier}) unavailable, trying next candidate:`, err.message);
        }

        if (lastGoodModel[tier] === modelName) delete lastGoodModel[tier];
        break;
      }
    }

    if (budgetExhausted) break;
  }

  const why = budgetExhausted
    ? `gave up after ${budgetMs}ms`
    : `tried ${tried.size} candidate(s)`;

  throw new ModelsUnavailableError(
    `tier=${tier}, ${why}, last error: ${lastError?.message ?? 'none'}`,
  );
}
