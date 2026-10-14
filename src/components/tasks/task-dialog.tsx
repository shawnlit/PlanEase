'use client';

import * as React from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskItem, TaskType } from '@/lib/validation';
import { Calendar as CalendarIcon, BookOpen, GraduationCap, CheckSquare, Loader2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit?: TaskItem | null;
  initialDate?: string | null;
  onSaved: (task: TaskItem, isNew: boolean) => void;
}

export function TaskDialog({
  open,
  onOpenChange,
  taskToEdit,
  initialDate,
  onSaved,
}: TaskDialogProps) {
  const [title, setTitle] = React.useState('');
  const [type, setType] = React.useState<TaskType>('task');
  const [deadlineDate, setDeadlineDate] = React.useState('');
  const [deadlineTime, setDeadlineTime] = React.useState('');
  const [status, setStatus] = React.useState<'pending' | 'completed'>('pending');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setType(taskToEdit.type);
        if (taskToEdit.deadline) {
          if (taskToEdit.deadline.includes('T')) {
            const [d, t] = taskToEdit.deadline.split('T');
            setDeadlineDate(d || '');
            setDeadlineTime(t ? t.substring(0, 5) : '');
          } else {
            setDeadlineDate(taskToEdit.deadline);
            setDeadlineTime('');
          }
        } else {
          setDeadlineDate('');
          setDeadlineTime('');
        }
        setStatus(taskToEdit.status);
      } else {
        setTitle('');
        setType('task');
        if (initialDate) {
          if (initialDate.includes('T')) {
            const [d, t] = initialDate.split('T');
            setDeadlineDate(d || '');
            setDeadlineTime(t ? t.substring(0, 5) : '');
          } else {
            setDeadlineDate(initialDate);
            setDeadlineTime('');
          }
        } else {
          setDeadlineDate('');
          setDeadlineTime('');
        }
        setStatus('pending');
      }
      setError(null);
    }
  }, [open, taskToEdit, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required. Please enter a descriptive title.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let finalDeadline: string | null = null;
      if (deadlineDate.trim()) {
        if (deadlineTime.trim()) {
          finalDeadline = `${deadlineDate.trim()}T${deadlineTime.trim()}`;
        } else {
          finalDeadline = deadlineDate.trim();
        }
      }

      const payload = {
        title: title.trim(),
        type,
        deadline: finalDeadline,
        status,
      };

      const url = taskToEdit ? `/api/tasks/${taskToEdit.id}` : '/api/tasks';
      const method = taskToEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save task');
      }

      onSaved(data.task, !taskToEdit);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeOptions: { value: TaskType; label: string; icon: React.ElementType }[] = [
    { value: 'exam', label: 'Exam', icon: GraduationCap },
    { value: 'assignment', label: 'Assignment', icon: BookOpen },
    { value: 'task', label: 'General', icon: CheckSquare },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogHeader>
        <DialogTitle>{taskToEdit ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        <DialogDescription>
          {taskToEdit
            ? 'Update task details and deadline.'
            : 'Add an academic assignment, exam date, or general task.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3 text-xs text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-700 dark:text-red-400 mt-0.5" aria-hidden="true" />
            <p className="leading-normal">{error}</p>
          </div>
        )}

        {/* Title Input */}
        <div>
          <label
            htmlFor="task-title-field"
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1"
          >
            Task Title <span className="text-red-600 dark:text-red-400" aria-hidden="true">*</span>
          </label>
          <Input
            id="task-title-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Database Systems Midterm, Math Problem Set 2"
            required
            aria-required="true"
          />
        </div>

        {/* Task Type Selection */}
        <div>
          <span
            id="task-type-label"
            className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
          >
            Task Type
          </span>
          <div
            role="radiogroup"
            aria-labelledby="task-type-label"
            className="grid grid-cols-3 gap-2"
          >
            {typeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = type === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    'flex flex-col items-center justify-center p-2.5 rounded-md border text-xs font-medium transition-colors cursor-pointer min-h-[44px]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100',
                    isSelected
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 font-semibold'
                      : 'border-zinc-300 bg-card text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600'
                  )}
                >
                  <Icon className="h-4 w-4 mb-1" aria-hidden="true" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Deadline & Time Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="task-deadline-date-field"
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              Deadline & Time (Optional)
            </label>
            {(deadlineDate || deadlineTime) && (
              <button
                type="button"
                onClick={() => {
                  setDeadlineDate('');
                  setDeadlineTime('');
                }}
                className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 underline cursor-pointer p-0.5"
              >
                Clear deadline
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Date Input */}
            <div>
              <label htmlFor="task-deadline-date-field" className="sr-only">
                Deadline Date
              </label>
              <div className="relative">
                <Input
                  id="task-deadline-date-field"
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  className="w-full pl-9 cursor-pointer"
                />
                <CalendarIcon
                  className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Time Input */}
            <div>
              <label htmlFor="task-deadline-time-field" className="sr-only">
                Deadline Time (Optional)
              </label>
              <div className="relative">
                <Input
                  id="task-deadline-time-field"
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  disabled={!deadlineDate}
                  className="w-full pl-9 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <Clock
                  className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
            <span>
              {deadlineDate && deadlineTime
                ? 'Scheduled for specific time slot on calendar.'
                : deadlineDate
                ? 'Scheduled as an all-day event on calendar.'
                : 'Tasks with deadlines appear automatically on your calendar.'}
            </span>
            {deadlineDate && deadlineTime && (
              <button
                type="button"
                onClick={() => setDeadlineTime('')}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 underline cursor-pointer shrink-0 ml-2"
              >
                Clear time (all-day)
              </button>
            )}
          </div>
        </div>

        {/* Status toggle (when editing) */}
        {taskToEdit && (
          <div>
            <span
              id="task-status-label"
              className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5"
            >
              Completion Status
            </span>
            <div
              role="radiogroup"
              aria-labelledby="task-status-label"
              className="grid grid-cols-2 gap-2"
            >
              <button
                type="button"
                role="radio"
                aria-checked={status === 'pending'}
                onClick={() => setStatus('pending')}
                className={cn(
                  'py-2 px-3 text-xs font-medium rounded-md border transition-colors cursor-pointer min-h-[38px]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100',
                  status === 'pending'
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 font-semibold'
                    : 'border-zinc-300 bg-card text-zinc-700 dark:border-zinc-700 dark:text-zinc-300'
                )}
              >
                Pending
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={status === 'completed'}
                onClick={() => setStatus('completed')}
                className={cn(
                  'py-2 px-3 text-xs font-medium rounded-md border transition-colors cursor-pointer min-h-[38px]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100',
                  status === 'completed'
                    ? 'border-emerald-700 bg-emerald-700 text-white dark:border-emerald-600 dark:bg-emerald-600 dark:text-white font-semibold'
                    : 'border-zinc-300 bg-card text-zinc-700 dark:border-zinc-700 dark:text-zinc-300'
                )}
              >
                Completed
              </button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" aria-hidden="true" />
                Saving...
              </>
            ) : taskToEdit ? (
              'Save Changes'
            ) : (
              'Create Task'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
