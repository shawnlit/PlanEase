'use client';

import * as React from 'react';
import { TaskItem } from '@/lib/validation';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, isDeadlineOverdue, isDeadlineToday, cn } from '@/lib/utils';
import { Calendar, Edit3, Trash2, AlertCircle, Clock } from 'lucide-react';

interface TaskItemProps {
  task: TaskItem;
  onToggleStatus: (task: TaskItem) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
}

export function TaskItemRow({
  task,
  onToggleStatus,
  onEdit,
  onDelete,
}: TaskItemProps) {
  const isCompleted = task.status === 'completed';
  const isOverdue = isDeadlineOverdue(task.deadline, task.status);
  const isToday = isDeadlineToday(task.deadline) && !isCompleted;

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'exam':
        return 'Exam';
      case 'assignment':
        return 'Assignment';
      default:
        return 'General';
    }
  };

  return (
    <article
      aria-label={`Task: ${task.title}, Type: ${getTypeLabel(task.type)}, Status: ${task.status}`}
      className={cn(
        'group flex items-center justify-between gap-3 rounded border p-3 sm:p-3.5 transition-colors',
        isCompleted
          ? 'border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400'
          : isOverdue
          ? 'border-red-300 bg-red-50/25 dark:border-red-900/60 dark:bg-red-950/15'
          : 'border-zinc-200 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
      )}
    >
      {/* Left side: Checkbox + Title + Badges + Deadline */}
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggleStatus(task)}
          id={`task-check-${task.id}`}
          aria-label={
            isCompleted
              ? `Mark "${task.title}" as pending`
              : `Mark "${task.title}" as completed`
          }
        />

        <div className="min-w-0 flex-1 space-y-1 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <label
              htmlFor={`task-check-${task.id}`}
              className={cn(
                'text-sm font-medium leading-snug cursor-pointer break-words',
                isCompleted
                  ? 'line-through text-zinc-500 dark:text-zinc-400'
                  : 'text-zinc-900 dark:text-zinc-100 font-semibold'
              )}
            >
              {task.title}
            </label>

            {/* Type badge */}
            <Badge variant={task.type} className="text-[10px] py-0 px-2 h-5">
              {getTypeLabel(task.type)}
            </Badge>

            {/* Overdue / Today alert badges */}
            {isOverdue && (
              <Badge variant="overdue" className="text-[10px] py-0 px-2 h-5 gap-1">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                Overdue
              </Badge>
            )}
            {isToday && (
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-2 h-5 border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200 gap-1 font-semibold"
              >
                <Clock className="h-3 w-3" aria-hidden="true" />
                Due Today
              </Badge>
            )}
          </div>

          {/* Deadline indicator */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            {task.deadline?.includes('T') ? (
              <Clock className="h-3 w-3 shrink-0 text-zinc-400" aria-hidden="true" />
            ) : (
              <Calendar className="h-3 w-3 shrink-0 text-zinc-400" aria-hidden="true" />
            )}
            <span className={cn(isOverdue && 'text-red-700 dark:text-red-400 font-semibold')}>
              {formatDate(task.deadline)}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(task)}
          className="h-9 w-9 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          aria-label={`Edit task "${task.title}"`}
          title={`Edit task "${task.title}"`}
        >
          <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(task)}
          className="h-9 w-9 text-zinc-500 hover:text-red-700 dark:text-zinc-400 dark:hover:text-red-400"
          aria-label={`Delete task "${task.title}"`}
          title={`Delete task "${task.title}"`}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}
