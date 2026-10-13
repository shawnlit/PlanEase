'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Plus, CheckCircle } from 'lucide-react';

interface HeaderProps {
  onOpenCreate: () => void;
}

export function Header({ onOpenCreate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-950">
            <CheckCircle className="h-4 w-4 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5">
              PlanEase
              <span className="text-[10px] font-medium tracking-normal text-zinc-500 border border-zinc-200 rounded px-1.5 py-0.2 dark:border-zinc-800 dark:text-zinc-400">
                v1.0
              </span>
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-none">
              Privacy-friendly student task & deadline manager
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <Button
            onClick={onOpenCreate}
            size="sm"
            className="gap-1.5 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
