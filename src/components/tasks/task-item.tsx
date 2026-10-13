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
        return 'Task';
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center justify-between gap-3 rounded-lg border p-3.5 transition-all duration-150',
        isCompleted
          ? 'border-zinc-200/60 bg-zinc-50/50 opacity-60 dark:border-zinc-800/60 dark:bg-zinc-900/30'
          : isOverdue
          ? 'border-red-200/80 bg-red-50/20 dark:border-red-900/40 dark:bg-red-950/10 hover:border-red-300'
          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700'
      )}
    >
      {/* Left side: Checkbox + Title + Badges */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="pt-0.5">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => onToggleStatus(task)}
            id={`task-${task.id}`}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'text-sm font-medium leading-tight transition-all',
                isCompleted
                  ? 'line-through text-zinc-400 dark:text-zinc-500'
                  : 'text-zinc-900 dark:text-zinc-100'
              )}
            >
              {task.title}
            </span>

            {/* Type badge */}
            <Badge variant={task.type} className="text-[10px] py-0 px-2 h-4.5">
              {getTypeLabel(task.type)}
            </Badge>

            {/* Overdue / Today alert badges */}
            {isOverdue && (
              <Badge variant="overdue" className="text-[10px] py-0 px-2 h-4.5 gap-1">
                <AlertCircle className="h-2.5 w-2.5" />
                Overdue
              </Badge>
            )}
            {isToday && (
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-2 h-4.5 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 gap-1"
              >
                <Clock className="h-2.5 w-2.5" />
                Due Today
              </Badge>
            )}
          </div>

          {/* Deadline indicator */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <Calendar className="h-3 w-3 shrink-0 opacity-70" />
            <span className={cn(isOverdue && 'text-red-600 dark:text-red-400 font-medium')}>
              {formatDate(task.deadline)}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Action buttons */}
      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(task)}
          className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          title="Edit Task"
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(task)}
          className="h-8 w-8 text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
          title="Delete Task"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
}
