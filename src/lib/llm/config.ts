/**
 * Server-side configuration for Free-Tier Groq AI Task Extraction.
 * Hard usage limits are enforced locally before making any network requests.
 */

// Confirmed Groq Free-Tier models supporting JSON Mode / structured output
export const VERIFIED_FREE_MODELS = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
] as const;

export type VerifiedFreeModel = typeof VERIFIED_FREE_MODELS[number];

export const LLM_CONFIG = {
  // Free-only provider
  PROVIDER: 'groq' as const,

  // Selected Free model ID (verified on Groq free-tier endpoint)
  DEFAULT_MODEL: 'openai/gpt-oss-20b' as VerifiedFreeModel,

  // Hard safety limits
  MAX_DAILY_REQUESTS: 10,
  MAX_REQUESTS_PER_MINUTE: 3,
  MAX_ACTIVE_REQUESTS: 1,
  MAX_INPUT_CHARS: 1500,
  MAX_PROPOSED_TASKS: 8,
  MAX_OUTPUT_TOKENS: 500,

  // Reference timezone for calendar day boundary resets
  TIMEZONE: 'Asia/Kolkata',

  // Rate limit cooldown (in milliseconds) when 429 is encountered
  DEFAULT_COOLDOWN_MS: 60 * 1000,
};

/**
 * Validates whether the configured model is verified on Groq's Free tier.
 * Returns the model ID or throws a setup error.
 */
export function getValidatedModelId(): string {
  const modelEnv = process.env.GROQ_MODEL?.trim();
  const selectedModel = modelEnv || LLM_CONFIG.DEFAULT_MODEL;

  const isVerified = VERIFIED_FREE_MODELS.includes(selectedModel as VerifiedFreeModel);
  if (!isVerified) {
    throw new Error(
      `Model "${selectedModel}" is not in the confirmed Groq Free-plan whitelist. Supported free models: ${VERIFIED_FREE_MODELS.join(', ')}.`
    );
  }

  return selectedModel;
}

/**
 * Returns the Groq API key or throws a descriptive error if missing.
 */
export function getGroqApiKey(): string {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key || key === 'your_groq_api_key' || key === 'your_groq_api_key_here') {
    throw new Error(
      'GROQ_API_KEY is not configured. Please add your free Groq API key to .env.local to enable AI task extraction.'
    );
  }
  return key;
}

/**
 * Verifies that the LLM_PROVIDER environment variable is set to 'groq'.
 */
export function validateLlmProvider(): void {
  const provider = process.env.LLM_PROVIDER?.trim().toLowerCase() || 'groq';
  if (provider !== 'groq') {
    throw new Error(
      `Unsupported LLM provider "${provider}". PlanEase is strictly configured for the Free Groq API only.`
    );
  }
}
