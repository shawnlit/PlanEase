import { LLM_CONFIG } from './config';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

let isAiRequestActive = false;
let cooldownUntilMs = 0;

export function getKolkataDateString(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: LLM_CONFIG.TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getKolkataReferenceDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: LLM_CONFIG.TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
  return `${parts} (${getKolkataDateString(date)})`;
}

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

export async function getUsageStatus(userId: string): Promise<UsageStatus> {
  const supabase = createSupabaseAdminClient();
  const today = getKolkataDateString();
  const minute = getCurrentMinuteTimestamp();
  const [{ count: todayCount, error: todayError }, { count: minuteCount, error: minuteError }] =
    await Promise.all([
      supabase
        .from('ai_usage')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('request_date', today),
      supabase
        .from('ai_usage')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('minute_timestamp', minute),
    ]);

  if (todayError) throw new Error(`Failed to retrieve daily AI usage: ${todayError.message}`);
  if (minuteError) throw new Error(`Failed to retrieve minute AI usage: ${minuteError.message}`);

  const now = Date.now();
  const inCooldown = now < cooldownUntilMs;
  return {
    todayCount: todayCount ?? 0,
    maxDaily: LLM_CONFIG.MAX_DAILY_REQUESTS,
    remainingDaily: Math.max(0, LLM_CONFIG.MAX_DAILY_REQUESTS - (todayCount ?? 0)),
    minuteCount: minuteCount ?? 0,
    maxPerMinute: LLM_CONFIG.MAX_REQUESTS_PER_MINUTE,
    isActive: isAiRequestActive,
    inCooldown,
    cooldownSecondsRemaining: inCooldown ? Math.ceil((cooldownUntilMs - now) / 1000) : 0,
  };
}

export async function reserveAiRequestSlot(userId: string, userText: string): Promise<() => void> {
  const trimmed = userText.trim();
  if (!trimmed) throw new Error('Please enter some text to extract tasks.');
  if (trimmed.length > LLM_CONFIG.MAX_INPUT_CHARS) {
    throw new Error(
      `Input exceeds maximum limit of ${LLM_CONFIG.MAX_INPUT_CHARS} characters (received ${trimmed.length}).`
    );
  }

  const now = Date.now();
  if (now < cooldownUntilMs) {
    const secondsLeft = Math.ceil((cooldownUntilMs - now) / 1000);
    throw new Error(
      `Provider cooldown active after rate limit. Please wait ${secondsLeft} second${secondsLeft === 1 ? '' : 's'} before trying again.`
    );
  }
  if (isAiRequestActive) {
    throw new Error('An AI extraction request is already in progress. Please wait for it to complete.');
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc('reserve_ai_request', {
    p_user_id: userId,
    p_request_date: getKolkataDateString(),
    p_minute_timestamp: getCurrentMinuteTimestamp(),
    p_max_daily: LLM_CONFIG.MAX_DAILY_REQUESTS,
    p_max_per_minute: LLM_CONFIG.MAX_REQUESTS_PER_MINUTE,
  });

  if (error) throw new Error(error.message);
  isAiRequestActive = true;
  return () => {
    isAiRequestActive = false;
  };
}

export function setProviderCooldown(cooldownMs = LLM_CONFIG.DEFAULT_COOLDOWN_MS): void {
  cooldownUntilMs = Date.now() + cooldownMs;
}

export async function logLlmAudit(userId: string, params: {
  userText: string;
  referenceDate: string;
  model: string;
  status: 'success' | 'error';
  tokensUsed?: number;
  errorMessage?: string;
}): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.rpc('insert_llm_log', {
    p_user_id: userId,
    p_user_text: params.userText,
    p_reference_date: params.referenceDate,
    p_model: params.model,
    p_status: params.status,
    p_tokens_used: params.tokensUsed ?? null,
    p_error_message: params.errorMessage ?? null,
  });
  if (error) console.error('[PlanEase Audit Log Error]', error.message);
}
