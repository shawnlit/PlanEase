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
      className="w-full md:w-48 shrink-0 flex flex-row md:flex-col gap-1 border-y md:border-y-0 md:border-l border-zinc-200 bg-transparent dark:border-zinc-800 overflow-x-auto"
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
              'flex-1 md:flex-none flex items-center justify-between border-l-2 border-transparent px-3 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap min-h-[38px]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-700 dark:focus-visible:ring-lime-300',
              isActive
                ? 'border-lime-700 bg-lime-100 text-zinc-950 dark:border-lime-300 dark:bg-lime-950/40 dark:text-zinc-50 font-semibold'
                : 'text-zinc-600 hover:border-zinc-400 hover:text-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100'
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span
                className={cn(
                  'ml-2 border px-1.5 py-0.2 text-[10px] font-semibold',
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
