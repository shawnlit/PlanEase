'use client';

import * as React from 'react';
import { TaskItem, TaskType } from '@/lib/validation';
import { TaskItemRow } from './task-item';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, CheckCircle2, ListFilter, X } from 'lucide-react';
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
      if (search.trim()) {
        const query = search.toLowerCase();
        if (!task.title.toLowerCase().includes(query)) return false;
      }
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }
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

  const isFiltered = search.trim().length > 0 || statusFilter !== 'all' || typeFilter !== 'all';

  return (
    <section aria-labelledby="task-checklist-heading" className="space-y-3.5">
      {/* Controls Bar: Search & Filters */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <label htmlFor="task-search-input" className="sr-only">
            Search tasks by title
          </label>
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" aria-hidden="true" />
          <Input
            id="task-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-card"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search input"
              className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 rounded cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Status Segmented Tabs */}
          <div
            role="tablist"
            aria-label="Filter tasks by completion status"
            className="inline-flex rounded border border-zinc-200 bg-zinc-100 p-0.5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                role="tab"
                aria-selected={statusFilter === opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer min-h-[30px]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-700 dark:focus-visible:ring-lime-300',
                  statusFilter === opt.value
                    ? 'bg-white text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Type Select Filter */}
          <div className="relative inline-flex items-center">
            <label htmlFor="task-type-filter" className="sr-only">
              Filter tasks by type
            </label>
            <div className="flex items-center gap-1.5 rounded border border-zinc-200 bg-card px-2.5 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:text-zinc-300 min-h-[34px]">
              <ListFilter className="h-3.5 w-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
              <select
                id="task-type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | TaskType)}
                className="bg-transparent text-xs font-medium text-foreground focus-visible:outline-none cursor-pointer"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Task List Content */}
      {isLoading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading tasks">
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-14 w-full rounded-md" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded border border-dashed border-zinc-300 py-10 px-4 text-center dark:border-zinc-800">
          <div className="rounded-full bg-zinc-100 p-2.5 dark:bg-zinc-900 mb-2.5 text-zinc-400">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {isFiltered ? 'No tasks match your filters' : 'No tasks on your list yet'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-sm">
            {isFiltered
              ? 'Try resetting your search query or switching your status filter.'
              : 'Add upcoming assignments, exam dates, or general study tasks.'}
          </p>
          <div className="mt-3 flex items-center gap-2">
            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
                className="text-xs"
              >
                Reset filters
              </Button>
            )}
            <Button
              onClick={onOpenCreate}
              size="sm"
              className="gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Add Task
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2" role="feed" aria-label="Tasks list">
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
    </section>
  );
}
