import { getDb } from '@/lib/db';
import { LLM_CONFIG } from './config';

// In-memory mutex for single concurrent request enforcement
let isAiRequestActive = false;

// Cooldown timestamp if a 429 rate limit is encountered
let cooldownUntilMs = 0;

/**
 * Returns today's calendar date string (YYYY-MM-DD) in Asia/Kolkata timezone.
 */
export function getKolkataDateString(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: LLM_CONFIG.TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Returns a human-friendly reference date string in Asia/Kolkata timezone.
 * Example: "Tuesday, October 14, 2026 (2026-10-14)"
 */
export function getKolkataReferenceDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: LLM_CONFIG.TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
  const iso = getKolkataDateString(date);
  return `${parts} (${iso})`;
}

/**
 * Returns the current minute timestamp for per-minute rate limiting.
 */
export function getCurrentMinuteTimestamp(): number {
  return Math.floor(Date.now() / 60000);
}

export interface UsageStatus {
  todayCount: number;
  maxDaily: number;
  remainingDaily: number;
  minuteCount: number;
  maxPerMinute: number;
  isActive: boolean;
  inCooldown: boolean;
  cooldownSecondsRemaining: number;
}

/**
 * Retrieves current usage statistics from SQLite without modifying anything.
 */
export function getUsageStatus(): UsageStatus {
  const db = getDb();
  const todayStr = getKolkataDateString();
  const currentMinute = getCurrentMinuteTimestamp();

  const dailyRow = db
    .prepare('SELECT count(*) as count FROM ai_usage WHERE request_date = ?')
    .get(todayStr) as { count: number };

  const minuteRow = db
    .prepare('SELECT count(*) as count FROM ai_usage WHERE minute_timestamp = ?')
    .get(currentMinute) as { count: number };

  const now = Date.now();
  const inCooldown = now < cooldownUntilMs;
  const cooldownSecondsRemaining = inCooldown ? Math.ceil((cooldownUntilMs - now) / 1000) : 0;

  const todayCount = dailyRow?.count || 0;
  const minuteCount = minuteRow?.count || 0;

  return {
    todayCount,
    maxDaily: LLM_CONFIG.MAX_DAILY_REQUESTS,
    remainingDaily: Math.max(0, LLM_CONFIG.MAX_DAILY_REQUESTS - todayCount),
    minuteCount,
    maxPerMinute: LLM_CONFIG.MAX_REQUESTS_PER_MINUTE,
    isActive: isAiRequestActive,
    inCooldown,
    cooldownSecondsRemaining,
  };
}

/**
 * Atomically checks hard limits and reserves a request slot in SQLite.
 * If any limit is reached, throws a descriptive error and stops without contacting Groq.
 * Returns a release callback that MUST be called when the request completes.
 */
export function reserveAiRequestSlot(userText: string): () => void {
  // 1. Validate input length prior to counting quota
  const trimmed = userText.trim();
  if (!trimmed) {
    throw new Error('Please enter some text to extract tasks.');
  }

  if (trimmed.length > LLM_CONFIG.MAX_INPUT_CHARS) {
    throw new Error(
      `Input exceeds maximum limit of ${LLM_CONFIG.MAX_INPUT_CHARS} characters (received ${trimmed.length}).`
    );
  }

  // 2. Check 429 cooldown
  const now = Date.now();
  if (now < cooldownUntilMs) {
    const secondsLeft = Math.ceil((cooldownUntilMs - now) / 1000);
    throw new Error(
      `Provider cooldown active after rate limit. Please wait ${secondsLeft} second${
        secondsLeft === 1 ? '' : 's'
      } before trying again.`
    );
  }

  // 3. Check active request mutex
  if (isAiRequestActive) {
    throw new Error(
      'An AI extraction request is already in progress. Please wait for it to complete.'
    );
  }

  const db = getDb();
  const todayStr = getKolkataDateString();
  const currentMinute = getCurrentMinuteTimestamp();

  // 4. Atomic check-and-insert using SQLite transaction
  const reserveTx = db.transaction(() => {
    const dailyRow = db
      .prepare('SELECT count(*) as count FROM ai_usage WHERE request_date = ?')
      .get(todayStr) as { count: number };

    if (dailyRow && dailyRow.count >= LLM_CONFIG.MAX_DAILY_REQUESTS) {
      throw new Error(
        `Daily Free-tier limit reached (${LLM_CONFIG.MAX_DAILY_REQUESTS}/${LLM_CONFIG.MAX_DAILY_REQUESTS} requests used today in Asia/Kolkata). PlanEase refuses to make further requests to keep your usage 100% free.`
      );
    }

    const minuteRow = db
      .prepare('SELECT count(*) as count FROM ai_usage WHERE minute_timestamp = ?')
      .get(currentMinute) as { count: number };

    if (minuteRow && minuteRow.count >= LLM_CONFIG.MAX_REQUESTS_PER_MINUTE) {
      throw new Error(
        `Rate limit: Maximum ${LLM_CONFIG.MAX_REQUESTS_PER_MINUTE} requests per minute reached. Please wait a minute before making another request.`
      );
    }

    // Atomically log the outbound attempt count
    db.prepare('INSERT INTO ai_usage (request_date, minute_timestamp) VALUES (?, ?)').run(
      todayStr,
      currentMinute
    );
  });

  // Execute the atomic reservation
  reserveTx();

  // Set in-memory active lock
  isAiRequestActive = true;

  // Return release function
  return () => {
    isAiRequestActive = false;
  };
}

/**
 * Activates a cooldown period when Groq returns HTTP 429.
 */
export function setProviderCooldown(cooldownMs = LLM_CONFIG.DEFAULT_COOLDOWN_MS): void {
  cooldownUntilMs = Date.now() + cooldownMs;
}

/**
 * Appends an audit record to llm_log for transmitted requests.
 */
export function logLlmAudit(params: {
  userText: string;
  referenceDate: string;
  model: string;
  status: 'success' | 'error';
  tokensUsed?: number;
  errorMessage?: string;
}): void {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO llm_log (user_text, reference_date, provider, model, status, tokens_used, error_message)
      VALUES (?, ?, 'groq', ?, ?, ?, ?)
    `).run(
      params.userText,
      params.referenceDate,
      params.model,
      params.status,
      params.tokensUsed ?? null,
      params.errorMessage ?? null
    );
  } catch (err) {
    console.error('[PlanEase Audit Log Error]', err);
  }
}
