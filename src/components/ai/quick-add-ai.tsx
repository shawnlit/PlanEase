'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProposedTasksPreview } from './proposed-tasks-preview';
import { ProposedTask } from '@/lib/validation';
import { useToast } from '@/components/ui/toast';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CornerDownLeft,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_CHARS = 1500;

interface UsageData {
  todayCount: number;
  maxDaily: number;
  remainingDaily: number;
  inCooldown: boolean;
  cooldownSecondsRemaining: number;
  minuteCount: number;
  maxPerMinute: number;
  minuteSecondsRemaining: number;
}

interface QuickAddAiProps {
  onTasksSaved: () => void;
}

export function QuickAddAi({ onTasksSaved }: QuickAddAiProps) {
  const [inputText, setInputText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [proposedTasks, setProposedTasks] = React.useState<ProposedTask[]>([]);
  const [usage, setUsage] = React.useState<UsageData | null>(null);
  const [minuteSecondsRemaining, setMinuteSecondsRemaining] = React.useState(0);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const { success, error: toastError } = useToast();
  const router = useRouter();

  const fetchUsage = React.useCallback(async () => {
    try {
      const res = await fetch('/api/parse');
      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }
      const data = await res.json();
      if (data.success && data.usage) {
        setUsage(data.usage);
        setMinuteSecondsRemaining(data.usage.minuteSecondsRemaining);
      }
    } catch {
      // Non-critical, ignore
    }
  }, [router]);

  React.useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  React.useEffect(() => {
    if (!usage || usage.minuteCount < usage.maxPerMinute) return;

    const timer = window.setInterval(() => {
      setMinuteSecondsRemaining((seconds) => {
        if (seconds <= 1) {
          void fetchUsage();
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [fetchUsage, usage]);

  const charCount = inputText.length;
  const isTooLong = charCount > MAX_CHARS;
  const isEmpty = inputText.trim().length === 0;

  const exampleChips = [
    'DBMS assignment due Thursday',
    'Maths exam on October 25',
    'Revise normalization tomorrow',
  ];

  const handleChipClick = (chipText: string) => {
    setInputText((prev) => {
      if (!prev.trim()) return chipText;
      return `${prev.trim()}, and ${chipText}`;
    });
    setErrorMessage(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleClear = () => {
    setInputText('');
    setErrorMessage(null);
    setProposedTasks([]);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleExtract = async () => {
    if (isEmpty || isTooLong || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText.trim() }),
      });

      const data = await res.json();

      if (data.usage) {
        setUsage(data.usage);
        setMinuteSecondsRemaining(data.usage.minuteSecondsRemaining);
      }

      if (res.status === 401) {
        router.replace('/auth/login');
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to extract tasks');
      }

      if (!data.tasks || data.tasks.length === 0) {
        setErrorMessage(
          'No tasks were found in your text. Please mention specific task names, assignments, or deadlines.'
        );
        setProposedTasks([]);
        return;
      }

      setProposedTasks(data.tasks);
      success(
        'Tasks Extracted',
        `${data.tasks.length} task${data.tasks.length === 1 ? '' : 's'} extracted. Review below before saving.`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred during extraction';
      setErrorMessage(msg);
      toastError('Extraction Failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExtract();
    }
  };

  const handleConfirmTasks = async (tasksToSave: ProposedTask[]) => {
    if (tasksToSave.length === 0) return;
    setIsSaving(true);

    try {
      const payload = {
        tasks: tasksToSave.map((t) => ({
          title: t.title,
          type: t.type,
          deadline: t.resolvedDate,
          status: 'pending' as const,
        })),
      };

      const res = await fetch('/api/tasks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save tasks batch');
      }

      success(
        'Tasks Saved',
        `Saved ${data.count} task${data.count === 1 ? '' : 's'} to your checklist and calendar.`
      );

      setInputText('');
      setProposedTasks([]);
      setErrorMessage(null);
      onTasksSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save tasks';
      toastError('Save Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section aria-labelledby="quick-add-heading" className="space-y-4">
      <Card className="border border-zinc-200 dark:border-zinc-800 bg-card shadow-2xs">
        <CardContent className="p-4 sm:p-5 space-y-3">
          {/* Section Header with Title & Quota */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <h2
                id="quick-add-heading"
                className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-zinc-600 dark:text-zinc-400" aria-hidden="true" />
                Quick Add with AI
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Type what you need to do in everyday language.
              </p>
            </div>

            {usage && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-200/60 dark:border-zinc-700/60 w-fit"
                  title="Requests reset at 00:00 Asia/Kolkata"
                >
                  Daily usage: {usage.todayCount}/{usage.maxDaily} requests
                </span>
                {usage.minuteCount >= usage.maxPerMinute && minuteSecondsRemaining > 0 && (
                  <span
                    className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/60 w-fit"
                    role="status"
                    aria-live="polite"
                  >
                    Minute limit reached. Try again in {minuteSecondsRemaining}s
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Example prompt chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Examples:</span>
            {exampleChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                aria-label={`Insert example text: ${chip}`}
                className="rounded border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Multiline Textarea with accessible label */}
          <div className="relative">
            <label htmlFor="quick-add-textarea" className="sr-only">
              Enter tasks to extract with AI
            </label>
            <textarea
              id="quick-add-textarea"
              ref={textareaRef}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={3}
              placeholder="Tell PlanEase what you need to do. For example: DBMS assignment due Thursday, Maths exam on October 25, and revise normalization tomorrow."
              aria-describedby="quick-add-char-count quick-add-privacy"
              className={cn(
                'w-full resize-y min-h-[85px] rounded-md border p-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 bg-white dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-100',
                isTooLong
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : 'border-zinc-300 dark:border-zinc-700'
              )}
            />

            {/* Character counter */}
            <div
              id="quick-add-char-count"
              className="flex justify-end text-[11px] text-zinc-500 dark:text-zinc-400 mt-1"
              aria-live="polite"
            >
              <span className={cn(isTooLong && 'text-red-600 dark:text-red-400 font-semibold')}>
                {charCount}
              </span>
              <span className="mx-0.5">/</span>
              <span>{MAX_CHARS} characters</span>
            </div>
          </div>

          {/* Error notice if extraction failed */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50/80 p-3 text-xs text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-700 dark:text-red-400" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-semibold">Unable to extract tasks</p>
                <p className="mt-0.5 leading-normal">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                aria-label="Dismiss error message"
                className="text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-100 p-0.5"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Action buttons and privacy notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div
              id="quick-add-privacy"
              className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400 shrink-0" aria-hidden="true" />
              <span>Sends entered text and today&apos;s date to Groq. No account data is shared.</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {inputText.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none text-xs"
                >
                  Clear
                </Button>
              )}

              <Button
                type="button"
                onClick={handleExtract}
                disabled={isEmpty || isTooLong || isLoading}
                size="sm"
                className="flex-1 sm:flex-none gap-1.5"
                aria-label="Extract tasks from text"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <span>Extract tasks</span>
                    <span className="hidden sm:inline-flex items-center text-[10px] text-zinc-400 dark:text-zinc-500">
                      <CornerDownLeft className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" /> ↵
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Confirmation Preview directly below */}
      {proposedTasks.length > 0 && (
        <ProposedTasksPreview
          tasks={proposedTasks}
          onTasksChange={setProposedTasks}
          onConfirm={handleConfirmTasks}
          onCancel={() => setProposedTasks([])}
          onRetry={handleExtract}
          isSaving={isSaving}
        />
      )}
    </section>
  );
}
