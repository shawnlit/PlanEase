'use client';

import * as React from 'react';
import { TaskItem, TaskType } from '@/lib/validation';
import { TaskItemRow } from './task-item';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, CheckCircle2, ListFilter, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskListProps {
  tasks: TaskItem[];
  isLoading: boolean;
  onToggleStatus: (task: TaskItem) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
  onOpenCreate: () => void;
}

export function TaskList({
  tasks,
  isLoading,
  onToggleStatus,
  onEdit,
  onDelete,
  onOpenCreate,
}: TaskListProps) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = React.useState<'all' | TaskType>('all');

  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase();
        if (!task.title.toLowerCase().includes(query)) return false;
      }
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'all' && task.type !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, search, statusFilter, typeFilter]);

  const statusOptions: { value: 'all' | 'pending' | 'completed'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
  ];

  const typeOptions: { value: 'all' | TaskType; label: string }[] = [
    { value: 'all', label: 'All Types' },
    { value: 'exam', label: 'Exams' },
    { value: 'assignment', label: 'Assignments' },
    { value: 'task', label: 'General' },
  ];

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9 bg-white dark:bg-zinc-950/60"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Segmented Control */}
          <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100/80 p-0.5 dark:border-zinc-800 dark:bg-zinc-900/80">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer',
                  statusFilter === opt.value
                    ? 'bg-white text-zinc-950 shadow-xs dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Type Select Filter */}
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300">
            <ListFilter className="h-3.5 w-3.5 text-zinc-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | TaskType)}
              className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-zinc-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Task List Content */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 py-12 px-4 text-center dark:border-zinc-800">
          <div className="rounded-full bg-zinc-100 p-3 dark:bg-zinc-900 mb-3 text-zinc-400">
            {search || statusFilter !== 'all' || typeFilter !== 'all' ? (
              <ClipboardList className="h-6 w-6" />
            ) : (
              <CheckCircle2 className="h-6 w-6" />
            )}
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {search || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'No matching tasks found'
              : 'No tasks on your list yet'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
            {search || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search terms or filters to find what you are looking for.'
              : 'Keep track of upcoming exams, course assignments, and general study tasks in one place.'}
          </p>
          {!(search || statusFilter !== 'all' || typeFilter !== 'all') && (
            <Button
              onClick={onOpenCreate}
              size="sm"
              className="mt-4 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add your first task
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => (
            <TaskItemRow
              key={task.id}
              task={task}
              onToggleStatus={onToggleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
