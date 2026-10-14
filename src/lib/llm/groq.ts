import Groq from 'groq-sdk';
import { LLM_CONFIG, getValidatedModelId, getGroqApiKey, validateLlmProvider } from './config';
import {
  reserveAiRequestSlot,
  logLlmAudit,
  setProviderCooldown,
  getKolkataReferenceDateString,
} from './usage-guard';
import {
  llmExtractionResponseSchema,
  LlmExtractedTask,
} from '@/lib/validation';

export interface ExtractionResult {
  tasks: LlmExtractedTask[];
  modelUsed: string;
  referenceDate: string;
  tokensUsed?: number;
}

/**
 * Extracts tasks from user input text using Groq's Free-tier API.
 * Enforces hard local usage guards, server-only API key security,
 * and zero automatic retries or fallbacks.
 */
export async function extractTasksWithGroq(userText: string): Promise<ExtractionResult> {
  // 1. Verify provider & configuration
  validateLlmProvider();
  const apiKey = getGroqApiKey();
  const modelId = getValidatedModelId();

  // 2. Obtain current reference date in Asia/Kolkata
  const referenceDateStr = getKolkataReferenceDateString();

  // 3. Atomically reserve request slot against SQLite usage limits
  // If limits are exceeded, this throws immediately before contacting Groq
  const releaseSlot = reserveAiRequestSlot(userText);

  let rawResponseText = '';
  let tokensUsed = 0;

  try {
    const groq = new Groq({ apiKey });

    const systemPrompt = `You are PlanEase Task Extractor for students. Your sole role is to extract academic tasks from the text into a JSON object.
Today's reference date in Asia/Kolkata is: ${referenceDateStr}.

Strict Instructions:
1. Extract at most ${LLM_CONFIG.MAX_PROPOSED_TASKS} distinct tasks.
2. For each task, extract:
   - "title": non-empty, clear task title (e.g. "DBMS assignment", "Maths midterm", "Revise normalization notes").
   - "type": must be exactly one of: "exam", "assignment", or "task".
   - "deadline_text": the exact spoken deadline phrase (e.g. "Thursday", "tomorrow", "October 25", "by 5pm"). If no deadline was mentioned, output null.
3. DO NOT calculate calendar dates or output YYYY-MM-DD. Return ONLY the spoken deadline phrase.
4. Output MUST be valid JSON adhering exactly to:
{
  "tasks": [
    {
      "title": "string",
      "type": "exam" | "assignment" | "task",
      "deadline_text": "string" | null
    }
  ]
}
Do not include any thinking, explanations, or extra properties.`;

    const response = await groq.chat.completions.create({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText.trim() },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: LLM_CONFIG.MAX_OUTPUT_TOKENS,
    });

    tokensUsed = response.usage?.total_tokens || 0;
    rawResponseText = response.choices[0]?.message?.content || '';

    if (!rawResponseText.trim()) {
      throw new Error('Groq returned an empty response.');
    }

    // 4. Parse and validate JSON structure with Zod
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawResponseText);
    } catch {
      throw new Error('Groq returned malformed JSON that could not be parsed.');
    }

    const validated = llmExtractionResponseSchema.safeParse(parsedJson);
    if (!validated.success) {
      const errorMsg = validated.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new Error(`Model output failed schema validation: ${errorMsg}`);
    }

    // 5. Append success audit log
    logLlmAudit({
      userText,
      referenceDate: referenceDateStr,
      model: modelId,
      status: 'success',
      tokensUsed,
    });

    return {
      tasks: validated.data.tasks,
      modelUsed: modelId,
      referenceDate: referenceDateStr,
      tokensUsed,
    };
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    const errorMessage = error.message || 'An error occurred during task extraction.';

    // Check for HTTP 429 Rate Limit from Groq
    if (error.status === 429) {
      setProviderCooldown(LLM_CONFIG.DEFAULT_COOLDOWN_MS);
      logLlmAudit({
        userText,
        referenceDate: referenceDateStr,
        model: modelId,
        status: 'error',
        errorMessage: 'Groq HTTP 429: Free-tier provider rate limit reached.',
      });
      throw new Error(
        'Groq Free-tier rate limit reached (HTTP 429). Further requests are temporarily paused for 60 seconds to protect your free account.'
      );
    }

    // Append error audit log
    logLlmAudit({
      userText,
      referenceDate: referenceDateStr,
      model: modelId,
      status: 'error',
      errorMessage,
    });

    throw new Error(errorMessage);
  } finally {
    releaseSlot();
  }
}
