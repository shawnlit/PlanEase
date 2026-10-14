'use client';

import * as React from 'react';
import { ProposedTask, TaskType } from '@/lib/validation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  AlertTriangle,
  AlertCircle,
  Trash2,
  CheckCircle,
  RotateCcw,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProposedTasksPreviewProps {
  tasks: ProposedTask[];
  onTasksChange: (tasks: ProposedTask[]) => void;
  onConfirm: (tasksToSave: ProposedTask[]) => Promise<void>;
  onCancel: () => void;
  onRetry: () => void;
  isSaving: boolean;
}

export function ProposedTasksPreview({
  tasks,
  onTasksChange,
  onConfirm,
  onCancel,
  onRetry,
  isSaving,
}: ProposedTasksPreviewProps) {
  const selectedCount = tasks.filter((t) => t.selected).length;

  // Check if any selected task has an unresolved ambiguous deadline
  const hasUnresolvedAmbiguity = tasks.some(
    (t) => t.selected && t.isAmbiguous && !t.resolvedDate
  );

  const handleToggleSelect = (tempId: string) => {
    onTasksChange(
      tasks.map((t) => (t.tempId === tempId ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleUpdateTitle = (tempId: string, title: string) => {
    onTasksChange(tasks.map((t) => (t.tempId === tempId ? { ...t, title } : t)));
  };

  const handleUpdateType = (tempId: string, type: TaskType) => {
    onTasksChange(tasks.map((t) => (t.tempId === tempId ? { ...t, type } : t)));
  };

  const handleUpdateDate = (tempId: string, resolvedDate: string | null) => {
    onTasksChange(
      tasks.map((t) => {
        if (t.tempId !== tempId) return t;
        // If user manually chose a date, ambiguity is resolved
        return {
          ...t,
          resolvedDate: resolvedDate || null,
          isAmbiguous: false,
        };
      })
    );
  };

  const handleRemove = (tempId: string) => {
    onTasksChange(tasks.filter((t) => t.tempId !== tempId));
  };

  const handleConfirm = async () => {
    const toSave = tasks.filter((t) => t.selected);
    if (toSave.length === 0) return;
    await onConfirm(toSave);
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Card className="border-indigo-200/70 bg-white/90 shadow-sm dark:border-indigo-950/60 dark:bg-zinc-950/90 animate-in fade-in-0 duration-200">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                Proposed Tasks Preview ({tasks.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Review, edit, and select extracted tasks before adding them to your schedule.
              </CardDescription>
            </div>
          </div>
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {selectedCount}
            </span>{' '}
            of {tasks.length} selected for saving
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-3">
        {hasUnresolvedAmbiguity && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Clarification Required</p>
              <p className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                One or more selected tasks have an incomplete deadline phrase. Please choose an exact date or clear the deadline before confirming.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {tasks.map((task) => {
            const hasAmbiguity = task.isAmbiguous && !task.resolvedDate;

            return (
              <div
                key={task.tempId}
                className={cn(
                  'rounded-lg border p-3.5 transition-all space-y-3',
                  task.selected
                    ? 'border-zinc-300 bg-white shadow-2xs dark:border-zinc-700 dark:bg-zinc-900/70'
                    : 'border-zinc-200/60 bg-zinc-50/40 opacity-70 dark:border-zinc-800/60 dark:bg-zinc-950/40'
                )}
              >
                {/* Header row: checkbox + title + delete button */}
                <div className="flex items-start gap-3">
                  <div className="pt-1">
                    <Checkbox
                      checked={task.selected}
                      onCheckedChange={() => handleToggleSelect(task.tempId)}
                      id={`preview-${task.tempId}`}
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <Input
                      value={task.title}
                      onChange={(e) => handleUpdateTitle(task.tempId, e.target.value)}
                      placeholder="Task title..."
                      className="h-8 text-sm font-medium bg-transparent"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(task.tempId)}
                    className="h-8 w-8 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Remove proposed task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Second row: Type selector & Date input & Warnings */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center pl-7">
                  {/* Task type pills */}
                  <div className="sm:col-span-4 flex items-center gap-1.5">
                    {(['exam', 'assignment', 'task'] as TaskType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleUpdateType(task.tempId, t)}
                        className={cn(
                          'px-2 py-0.5 rounded text-[11px] font-medium border capitalize transition-all cursor-pointer',
                          task.type === t
                            ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Deadline input */}
                  <div className="sm:col-span-8 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type="date"
                        value={task.resolvedDate || ''}
                        onChange={(e) => handleUpdateDate(task.tempId, e.target.value)}
                        className={cn(
                          'h-8 pl-8 text-xs cursor-pointer',
                          hasAmbiguity && 'border-amber-400 dark:border-amber-600'
                        )}
                      />
                      <Calendar className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                    </div>

                    {task.resolvedDate && (
                      <button
                        type="button"
                        onClick={() => handleUpdateDate(task.tempId, null)}
                        className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline cursor-pointer whitespace-nowrap"
                      >
                        Clear date
                      </button>
                    )}
                  </div>
                </div>

                {/* Deadline phrase and warning indicators */}
                <div className="pl-7 flex flex-wrap items-center gap-2 text-xs">
                  {task.deadline_text && (
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Original text:{' '}
                      <span className="italic font-mono text-zinc-700 dark:text-zinc-300">
                        &ldquo;{task.deadline_text}&rdquo;
                      </span>
                    </span>
                  )}

                  {hasAmbiguity && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300 gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {task.clarificationReason || 'Clarification needed'}
                    </Badge>
                  )}

                  {task.isPast && !hasAmbiguity && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300 gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      Past deadline
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-5 pt-0 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            disabled={isSaving}
            className="flex-1 sm:flex-none text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try again
          </Button>
        </div>

        <Button
          onClick={handleConfirm}
          disabled={selectedCount === 0 || hasUnresolvedAmbiguity || isSaving}
          size="sm"
          className="w-full sm:w-auto gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving to SQLite...
            </>
          ) : (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              Confirm {selectedCount} selected task{selectedCount === 1 ? '' : 's'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
