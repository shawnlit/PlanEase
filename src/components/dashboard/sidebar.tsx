'use client';

import * as React from 'react';
import { LayoutDashboard, CheckSquare, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ActiveTab = 'all' | 'tasks' | 'calendar';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  taskCount: number;
}

export function Sidebar({ activeTab, onTabChange, taskCount }: SidebarProps) {
  const navItems = [
    {
      id: 'all' as ActiveTab,
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'tasks' as ActiveTab,
      label: 'Checklist',
      icon: CheckSquare,
      badge: taskCount,
    },
    {
      id: 'calendar' as ActiveTab,
      label: 'Calendar',
      icon: Calendar,
    },
  ];

  return (
    <nav
      role="tablist"
      aria-label="Dashboard view navigation"
      className="w-full md:w-52 shrink-0 flex flex-row md:flex-col gap-1 p-1 rounded-lg border border-zinc-200 bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-900/60 overflow-x-auto"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            aria-label={`${item.label} view${item.badge !== undefined ? ` (${item.badge} tasks)` : ''}`}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'flex-1 md:flex-none flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap min-h-[38px]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100',
              isActive
                ? 'bg-white text-zinc-950 shadow-2xs dark:bg-zinc-800 dark:text-zinc-50 font-semibold'
                : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/50'
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span
                className={cn(
                  'ml-2 rounded px-1.5 py-0.2 text-[10px] font-semibold',
                  isActive
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100'
                    : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                )}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
