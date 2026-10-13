'use client';

import * as React from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskItem, TaskType } from '@/lib/validation';
import { Calendar as CalendarIcon, BookOpen, GraduationCap, CheckSquare, Loader2 } from 'lucide-react';
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
  const [deadline, setDeadline] = React.useState('');
  const [status, setStatus] = React.useState<'pending' | 'completed'>('pending');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sync state when dialog opens or taskToEdit changes
  React.useEffect(() => {
    if (open) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setType(taskToEdit.type);
        setDeadline(taskToEdit.deadline ? taskToEdit.deadline.split('T')[0] : '');
        setStatus(taskToEdit.status);
      } else {
        setTitle('');
        setType('task');
        setDeadline(initialDate ? initialDate.split('T')[0] : '');
        setStatus('pending');
      }
      setError(null);
    }
  }, [open, taskToEdit, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        type,
        deadline: deadline.trim() ? deadline.trim() : null,
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

  const typeOptions: { value: TaskType; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'exam', label: 'Exam', icon: GraduationCap, color: 'hover:border-rose-300 dark:hover:border-rose-800' },
    { value: 'assignment', label: 'Assignment', icon: BookOpen, color: 'hover:border-blue-300 dark:hover:border-blue-800' },
    { value: 'task', label: 'General Task', icon: CheckSquare, color: 'hover:border-zinc-400 dark:hover:border-zinc-700' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogHeader>
        <DialogTitle>{taskToEdit ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        <DialogDescription>
          {taskToEdit
            ? 'Update the details and deadline of this task.'
            : 'Add an academic deadline, assignment, or general task.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-xs text-red-600 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Title Input */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Title <span className="text-red-500">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Database Midterm, Math Problem Set 2"
            className="mt-1"
            autoFocus
          />
        </div>

        {/* Task Type Selection */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Task Type
          </label>
          <div className="grid grid-cols-3 gap-2 mt-1.5">
            {typeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = type === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={cn(
                    'flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                    opt.color,
                    isSelected
                      ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                      : 'border-zinc-200 bg-zinc-50/50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300'
                  )}
                >
                  <Icon className="h-4 w-4 mb-1" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Deadline Input */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Deadline (Optional)
            </label>
            {deadline && (
              <button
                type="button"
                onClick={() => setDeadline('')}
                className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 underline cursor-pointer"
              >
                Clear date
              </button>
            )}
          </div>
          <div className="relative mt-1">
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full pl-9 cursor-pointer"
            />
            <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            Tasks with deadlines will appear directly on your calendar.
          </p>
        </div>

        {/* Status toggle (if editing) */}
        {taskToEdit && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Status
            </label>
            <div className="flex gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-medium rounded-md border transition-all cursor-pointer',
                  status === 'pending'
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                    : 'border-zinc-200 bg-transparent text-zinc-600 dark:border-zinc-800 dark:text-zinc-400'
                )}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={cn(
                  'flex-1 py-1.5 text-xs font-medium rounded-md border transition-all cursor-pointer',
                  status === 'completed'
                    ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-white'
                    : 'border-zinc-200 bg-transparent text-zinc-600 dark:border-zinc-800 dark:text-zinc-400'
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
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
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
