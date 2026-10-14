'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_CHARS = 1500;

interface UsageData {
  todayCount: number;
  maxDaily: number;
  remainingDaily: number;
  inCooldown: boolean;
  cooldownSecondsRemaining: number;
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

  const { success, error: toastError } = useToast();

  const fetchUsage = React.useCallback(async () => {
    try {
      const res = await fetch('/api/parse');
      const data = await res.json();
      if (data.success && data.usage) {
        setUsage(data.usage);
      }
    } catch {
      // Non-critical, ignore
    }
  }, []);

  React.useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

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
  };

  const handleClear = () => {
    setInputText('');
    setErrorMessage(null);
    setProposedTasks([]);
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
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to extract tasks');
      }

      if (!data.tasks || data.tasks.length === 0) {
        setErrorMessage(
          'No specific tasks could be identified in your text. Try phrasing them with task names, exams, or deadlines.'
        );
        setProposedTasks([]);
        return;
      }

      setProposedTasks(data.tasks);
      success(
        'Tasks Extracted',
        `Extracted ${data.tasks.length} task${data.tasks.length === 1 ? '' : 's'}. Review before confirming.`
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
    // Ctrl+Enter or Cmd+Enter to submit
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
        'Tasks Saved to SQLite',
        `Successfully saved ${data.count} task${data.count === 1 ? '' : 's'} to your checklist and calendar.`
      );

      // Clear input and proposed preview
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
    <div className="space-y-4">
      <Card className="border-zinc-200/90 bg-white dark:border-zinc-800/90 dark:bg-zinc-950/70 shadow-xs">
        <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white dark:bg-indigo-500 shadow-2xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Quick Add with AI
                </CardTitle>
                <CardDescription className="text-xs">
                  Convert natural language study sentences into organized tasks using Free Groq AI.
                </CardDescription>
              </div>
            </div>

            {/* Quota indicator */}
            {usage && (
              <div
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border',
                  usage.remainingDaily <= 2
                    ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400'
                )}
                title="Requests reset at 00:00 Asia/Kolkata"
              >
                <Gauge className="h-3 w-3" />
                <span>
                  Free Quota: {usage.todayCount}/{usage.maxDaily} used today
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-3.5">
          {/* Example prompt chips */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-[11px] text-zinc-400 font-medium">Try:</span>
            {exampleChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="rounded-full border border-zinc-200 bg-zinc-50/80 px-2.5 py-0.5 text-[11px] text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                + {chip}
              </button>
            ))}
          </div>

          {/* Large Multiline Textarea */}
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={3}
              placeholder="Tell PlanEase what you need to do. For example: DBMS assignment due Thursday, Maths exam on October 25, and revise normalization tomorrow."
              className={cn(
                'w-full resize-y min-h-[90px] rounded-lg border p-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 bg-white dark:bg-zinc-950',
                isTooLong
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : 'border-zinc-200 dark:border-zinc-800'
              )}
            />

            {/* Character counter */}
            <div className="absolute right-2.5 bottom-2 text-[10px] text-zinc-400 pointer-events-none">
              <span className={cn(isTooLong && 'text-red-500 font-bold')}>
                {charCount}
              </span>{' '}
              / {MAX_CHARS}
            </div>
          </div>

          {/* Error notice if extraction failed */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/70 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Extraction Issue</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Action buttons and privacy notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Sends only entered text and today&apos;s date to Groq. No user history is sent.
              </span>
            </div>

            <div className="flex items-center gap-2">
              {inputText.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={isLoading}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Clear
                </Button>
              )}

              <Button
                type="button"
                onClick={handleExtract}
                disabled={isEmpty || isTooLong || isLoading}
                size="sm"
                className="gap-1.5 shadow-xs bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Extract tasks</span>
                    <span className="hidden sm:inline-flex items-center ml-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                      <CornerDownLeft className="h-2.5 w-2.5 mr-0.5" /> ↵
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
    </div>
  );
}
