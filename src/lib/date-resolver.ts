import * as chrono from 'chrono-node';
import { LLM_CONFIG } from './llm/config';
import { getKolkataDateString } from './llm/usage-guard';

export interface ResolvedDateResult {
  originalText: string | null;
  resolvedDate: string | null; // ISO YYYY-MM-DD or YYYY-MM-DDTHH:MM
  isAmbiguous: boolean;
  isPast: boolean;
  clarificationReason?: string;
  warning?: string;
}

const MONTH_NAMES_REGEX = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i;
const DAY_ORDINAL_ONLY_REGEX = /(?:on\s+the\s+|by\s+the\s+|the\s+)?\b([1-3]?[0-9])(?:st|nd|rd|th)\b/i;

/**
 * Resolves a natural-language deadline phrase into a YYYY-MM-DD string.
 * Uses chrono-node with an explicit reference date in Asia/Kolkata timezone.
 *
 * Rules:
 * - Missing deadlines return null without ambiguity.
 * - Incomplete dates without months (e.g. "on the 25th") are flagged as ambiguous; no month is guessed.
 * - Ambiguous expressions that cannot be resolved to a specific day are flagged for clarification.
 * - Past dates are flagged with an isPast warning.
 */
export function resolveDeadlinePhrase(
  deadlineText: string | null | undefined,
  referenceDate = new Date()
): ResolvedDateResult {
  if (!deadlineText || !deadlineText.trim()) {
    return {
      originalText: null,
      resolvedDate: null,
      isAmbiguous: false,
      isPast: false,
    };
  }

  const rawPhrase = deadlineText.trim();
  const todayKolkata = getKolkataDateString(referenceDate);

  // Check 1: Incomplete date like "on the 25th", "by 15th" without a month
  if (DAY_ORDINAL_ONLY_REGEX.test(rawPhrase) && !MONTH_NAMES_REGEX.test(rawPhrase)) {
    return {
      originalText: rawPhrase,
      resolvedDate: null,
      isAmbiguous: true,
      isPast: false,
      clarificationReason: `Day of month specified ("${rawPhrase}") without a month. Please specify a month or select a date.`,
    };
  }

  // Parse with chrono-node relative to reference date
  const parsedResults = chrono.parse(rawPhrase, referenceDate, {
    forwardDate: true, // Prefer upcoming dates for phrases like "Wednesday"
  });

  if (!parsedResults || parsedResults.length === 0) {
    return {
      originalText: rawPhrase,
      resolvedDate: null,
      isAmbiguous: true,
      isPast: false,
      clarificationReason: `Could not resolve a specific date from "${rawPhrase}". Please specify a clear deadline.`,
    };
  }

  const firstResult = parsedResults[0];
  const dateObj = firstResult.start.date();

  // Format explicitly in Asia/Kolkata timezone
  const formattedDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: LLM_CONFIG.TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj); // Produces YYYY-MM-DD

  // Preserve an explicitly spoken time for the preview and saved task.
  // Chrono's date object can be affected by the server's local timezone, so
  // use its parsed hour/minute components rather than Date#getHours().
  let resolvedDate = formattedDate;
  if (firstResult.start.isCertain('hour')) {
    const hour = firstResult.start.get('hour');
    const minute = firstResult.start.get('minute') ?? 0;
    resolvedDate = `${formattedDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  // Check if parsed date is in the past
  const isPast = formattedDate < todayKolkata;
  let warning: string | undefined;

  if (isPast) {
    warning = `Resolved date (${formattedDate}) is before today (${todayKolkata}).`;
  }

  return {
    originalText: rawPhrase,
    resolvedDate,
    isAmbiguous: false,
    isPast,
    warning,
  };
}
