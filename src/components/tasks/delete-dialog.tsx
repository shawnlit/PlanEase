'use client';

import * as React from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TaskItem } from '@/lib/validation';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskItem | null;
  onDeleted: (taskId: number) => void;
}

export function DeleteDialog({
  open,
  onOpenChange,
  task,
  onDeleted,
}: DeleteDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDelete = async () => {
    if (!task) return;
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete task');
      }

      onDeleted(task.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting task');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogHeader>
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-1">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
          <DialogTitle>Delete Task</DialogTitle>
        </div>
        <DialogDescription>
          Are you sure you want to delete{' '}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            &ldquo;{task?.title}&rdquo;
          </span>
          ? This will permanently remove it from your schedule and database.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-3 text-xs text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200 mb-3"
        >
          {error}
        </div>
      )}

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          className="min-w-[90px]"
        >
          {isDeleting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" aria-hidden="true" />
              Deleting...
            </>
          ) : (
            'Delete'
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
