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
  Loader2,
  Clock,
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

  const handleUpdateDatePart = (tempId: string, newDate: string) => {
    onTasksChange(
      tasks.map((t) => {
        if (t.tempId !== tempId) return t;
        if (!newDate) return { ...t, resolvedDate: null, isAmbiguous: false };
        const currentTime = t.resolvedDate && t.resolvedDate.includes('T') ? t.resolvedDate.split('T')[1].substring(0, 5) : '';
        return {
          ...t,
          resolvedDate: currentTime ? `${newDate}T${currentTime}` : newDate,
          isAmbiguous: false,
        };
      })
    );
  };

  const handleUpdateTimePart = (tempId: string, newTime: string) => {
    onTasksChange(
      tasks.map((t) => {
        if (t.tempId !== tempId) return t;
        const currentDate = t.resolvedDate ? t.resolvedDate.split('T')[0] : '';
        if (!currentDate) return t;
        return {
          ...t,
          resolvedDate: newTime ? `${currentDate}T${newTime}` : currentDate,
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
    <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <CardTitle className="text-sm font-semibold">
              Proposed Tasks Preview ({tasks.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Review, edit, or uncheck tasks before saving them to your checklist.
            </CardDescription>
          </div>
          <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {selectedCount}
            </span>{' '}
            of {tasks.length} selected
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {hasUnresolvedAmbiguity && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" aria-hidden="true" />
            <div>
              <p className="font-semibold">Clarification Required</p>
              <p className="mt-0.5 text-[11px] leading-normal">
                One or more selected tasks have an incomplete deadline. Please choose a specific date or clear the deadline before confirming.
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
                  'rounded-md border p-3 transition-colors space-y-2.5',
                  task.selected
                    ? 'border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900/60'
                    : 'border-zinc-200 bg-zinc-50/50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900/20'
                )}
              >
                {/* Title row */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={task.selected}
                    onCheckedChange={() => handleToggleSelect(task.tempId)}
                    id={`preview-${task.tempId}`}
                    aria-label={`Select task: ${task.title || 'Untitled'}`}
                  />

                  <div className="flex-1">
                    <label htmlFor={`input-title-${task.tempId}`} className="sr-only">
                      Task Title
                    </label>
                    <Input
                      id={`input-title-${task.tempId}`}
                      value={task.title}
                      onChange={(e) => handleUpdateTitle(task.tempId, e.target.value)}
                      placeholder="Task title..."
                      className="h-8 text-sm font-medium"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(task.tempId)}
                    className="h-8 w-8 text-zinc-400 hover:text-red-700 dark:hover:text-red-400"
                    aria-label={`Remove task ${task.title || 'Untitled'}`}
                    title="Remove proposed task"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>

                {/* Second row: Type pills & Date input */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pl-8">
                  {/* Task type pills */}
                  <div className="sm:col-span-5 flex items-center gap-1" role="radiogroup" aria-label="Task Type">
                    {(['exam', 'assignment', 'task'] as TaskType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={task.type === t}
                        onClick={() => handleUpdateType(task.tempId, t)}
                        className={cn(
                          'px-2 py-0.5 rounded text-[11px] font-medium border capitalize transition-colors cursor-pointer',
                          task.type === t
                            ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        )}
                      >
                        {t === 'task' ? 'General' : t}
                      </button>
                    ))}
                  </div>

                  {/* Deadline & Time pickers */}
                  <div className="sm:col-span-7 flex flex-wrap sm:flex-nowrap items-center gap-1.5">
                    <div className="relative flex-1 min-w-[120px]">
                      <label htmlFor={`input-date-${task.tempId}`} className="sr-only">
                        Deadline date
                      </label>
                      <Input
                        id={`input-date-${task.tempId}`}
                        type="date"
                        value={task.resolvedDate ? task.resolvedDate.split('T')[0] : ''}
                        onChange={(e) => handleUpdateDatePart(task.tempId, e.target.value)}
                        className={cn(
                          'h-8 pl-8 text-xs cursor-pointer',
                          hasAmbiguity && 'border-amber-400 dark:border-amber-600'
                        )}
                      />
                      <Calendar className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" aria-hidden="true" />
                    </div>

                    <div className="relative w-28 shrink-0">
                      <label htmlFor={`input-time-${task.tempId}`} className="sr-only">
                        Deadline time
                      </label>
                      <Input
                        id={`input-time-${task.tempId}`}
                        type="time"
                        value={task.resolvedDate && task.resolvedDate.includes('T') ? task.resolvedDate.split('T')[1].substring(0, 5) : ''}
                        onChange={(e) => handleUpdateTimePart(task.tempId, e.target.value)}
                        disabled={!task.resolvedDate}
                        className="h-8 pl-7 text-xs cursor-pointer disabled:opacity-40"
                      />
                      <Clock className="absolute left-2 top-2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" aria-hidden="true" />
                    </div>

                    {task.resolvedDate && (
                      <button
                        type="button"
                        onClick={() => handleUpdateDatePart(task.tempId, '')}
                        className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 underline cursor-pointer whitespace-nowrap p-1"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Deadline phrase and warning indicators */}
                <div className="pl-8 flex flex-wrap items-center gap-2 text-xs">
                  {task.deadline_text && (
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Spoken phrase:{' '}
                      <span className="font-mono text-zinc-700 dark:text-zinc-300 font-medium">
                        &ldquo;{task.deadline_text}&rdquo;
                      </span>
                    </span>
                  )}

                  {hasAmbiguity && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 gap-1"
                    >
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      {task.clarificationReason || 'Clarification needed'}
                    </Badge>
                  )}

                  {task.isPast && !hasAmbiguity && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                      Past deadline
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-4 pt-0 border-t border-zinc-100 dark:border-zinc-800">
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
            className="flex-1 sm:flex-none text-zinc-600 dark:text-zinc-400 gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Try again
          </Button>
        </div>

        <Button
          onClick={handleConfirm}
          disabled={selectedCount === 0 || hasUnresolvedAmbiguity || isSaving}
          size="sm"
          className="w-full sm:w-auto gap-1.5"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Saving to your checklist...
            </>
          ) : (
            <>
              <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Confirm {selectedCount} task{selectedCount === 1 ? '' : 's'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
