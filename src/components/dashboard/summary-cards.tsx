'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskSummary } from '@/lib/validation';
import { CheckSquare, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  summary: TaskSummary | null;
  isLoading: boolean;
  onFilterClick?: (filterStatus: 'all' | 'pending' | 'completed' | 'overdue') => void;
}

export function SummaryCards({ summary, isLoading }: SummaryCardsProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Tasks',
      value: summary.total,
      icon: CheckSquare,
      color: 'text-zinc-600 dark:text-zinc-400',
      bgColor: 'bg-zinc-100 dark:bg-zinc-900',
    },
    {
      title: 'Pending',
      value: summary.pending,
      icon: Clock,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      title: 'Completed',
      value: summary.completed,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      title: 'Overdue',
      value: summary.overdue,
      icon: AlertTriangle,
      color: summary.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-500 dark:text-zinc-400',
      bgColor: summary.overdue > 0 ? 'bg-red-50 dark:bg-red-950/40' : 'bg-zinc-100 dark:bg-zinc-900',
      isOverdueAlert: summary.overdue > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className={cn(
              'border transition-all duration-150',
              card.isOverdueAlert
                ? 'border-red-200 bg-red-50/30 dark:border-red-900/40 dark:bg-red-950/20'
                : 'hover:border-zinc-300 dark:hover:border-zinc-700'
            )}
          >
            <CardContent className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {card.title}
                </p>
                <p
                  className={cn(
                    'text-2xl sm:text-3xl font-bold tracking-tight mt-1',
                    card.isOverdueAlert
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-zinc-900 dark:text-zinc-100'
                  )}
                >
                  {card.value}
                </p>
              </div>
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  card.bgColor,
                  card.color
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
