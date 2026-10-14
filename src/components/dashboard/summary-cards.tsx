'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskSummary } from '@/lib/validation';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  summary: TaskSummary | null;
  isLoading: boolean;
}

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-md" />
        ))}
      </div>
    );
  }

  const items = [
    {
      title: 'Total Tasks',
      value: summary.total,
      description: 'In your schedule',
    },
    {
      title: 'Pending',
      value: summary.pending,
      description: 'To be completed',
    },
    {
      title: 'Completed',
      value: summary.completed,
      description: 'Finished items',
    },
    {
      title: 'Overdue',
      value: summary.overdue,
      description: summary.overdue > 0 ? 'Requires attention' : 'None overdue',
      isOverdue: summary.overdue > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" role="region" aria-label="Task Summary Statistics">
      {items.map((item) => (
        <Card
          key={item.title}
          className={cn(
            'border bg-card transition-colors',
            item.isOverdue
              ? 'border-red-300 dark:border-red-800/80 bg-red-50/20 dark:bg-red-950/10'
              : 'border-zinc-200 dark:border-zinc-800'
          )}
        >
          <CardContent className="p-3 sm:p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {item.title}
              </span>
              {item.isOverdue && (
                <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" aria-hidden="true" />
              )}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className={cn(
                  'text-xl font-bold tracking-tight',
                  item.isOverdue
                    ? 'text-red-700 dark:text-red-400'
                    : 'text-zinc-900 dark:text-zinc-100'
                )}
              >
                {item.value}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden sm:inline">
                {item.description}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
