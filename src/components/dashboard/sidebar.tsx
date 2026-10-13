'use client';

import * as React from 'react';
import { LayoutDashboard, CheckSquare, Calendar, Database, ShieldCheck } from 'lucide-react';
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
      description: 'Tasks & Calendar',
    },
    {
      id: 'tasks' as ActiveTab,
      label: 'Checklist',
      icon: CheckSquare,
      badge: taskCount,
      description: 'Task management',
    },
    {
      id: 'calendar' as ActiveTab,
      label: 'Calendar',
      icon: Calendar,
      description: 'Month & week views',
    },
  ];

  return (
    <aside className="w-full md:w-60 flex-shrink-0 flex flex-col justify-between py-2 gap-4">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all cursor-pointer',
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-2xs'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    isActive
                      ? 'bg-zinc-800 text-zinc-100 dark:bg-zinc-200 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Database & Privacy status badge */}
      <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 dark:border-zinc-800/80 dark:bg-zinc-900/40 space-y-2">
        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <Database className="h-3.5 w-3.5 text-indigo-500" />
          <span className="text-[11px] font-semibold">SQLite Storage</span>
        </div>
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Local embedded SQLite database (`data/planease.db`) with raw SQL schema and views.
        </p>
        <div className="pt-1 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck className="h-3 w-3" />
          <span>Privacy-First • No Cloud Tracking</span>
        </div>
      </div>
    </aside>
  );
}
