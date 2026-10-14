'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LogoutButton } from '@/components/auth/logout-button';
import { Plus } from 'lucide-react';

interface HeaderProps {
  onOpenCreate: () => void;
}

export function Header({ onOpenCreate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-card/95 backdrop-blur-xs dark:border-zinc-800">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Branding & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 text-[11px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
              P
            </span>
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              PlanEase
            </span>
          </div>
          <span className="hidden sm:inline-block h-3.5 w-px bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />
          <span className="hidden sm:inline-block text-xs text-zinc-500 dark:text-zinc-400">
            Student Task & Deadline Manager
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LogoutButton />
          <Button
            onClick={onOpenCreate}
            size="sm"
            className="gap-1.5 h-8 px-3 text-xs"
            aria-label="Create new task"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>New Task</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
