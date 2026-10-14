'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  'aria-label'?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled, id, 'aria-label': ariaLabel, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center justify-center p-2 -m-2 min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation">
        <input
          type="checkbox"
          id={id}
          ref={ref}
          checked={checked}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="peer sr-only"
          {...props}
        />
        <div
          role="checkbox"
          aria-checked={checked}
          aria-label={ariaLabel}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              if (!disabled) onCheckedChange?.(!checked);
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onCheckedChange?.(!checked);
          }}
          className={cn(
            'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border transition-colors cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-100 dark:ring-offset-zinc-950',
            disabled && 'cursor-not-allowed opacity-50',
            checked
              ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-950'
              : 'border-zinc-400 bg-white hover:border-zinc-600 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-400',
            className
          )}
        >
          {checked && <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden="true" />}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
