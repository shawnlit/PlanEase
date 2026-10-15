'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onOpenChange(false);
          return;
        }

        // Focus trap inside dialog
        if (e.key === 'Tab' && dialogRef.current) {
          const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length > 0) {
            const first = focusableElements[0];
            const last = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      // Auto-focus first input or dialog container
      const timer = setTimeout(() => {
        if (dialogRef.current) {
          const firstInput = dialogRef.current.querySelector<HTMLElement>(
            'input:not([type="hidden"]), textarea, select, button[type="submit"]'
          );
          if (firstInput) {
            firstInput.focus();
          } else {
            dialogRef.current.focus();
          }
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
        if (previouslyFocusedRef.current) {
          previouslyFocusedRef.current.focus();
        }
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded border border-zinc-200 bg-white dark:bg-zinc-900 p-5 sm:p-6 text-zinc-900 dark:text-zinc-50 dark:border-zinc-800"
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1 text-left mb-4', className)}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-base font-semibold leading-normal text-zinc-900 dark:text-zinc-50', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-xs text-zinc-600 dark:text-zinc-400', className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-5 gap-2 sm:gap-0 pt-2 border-t border-zinc-100 dark:border-zinc-800',
        className
      )}
      {...props}
    />
  );
}

export function DialogClose({
  onClick,
}: {
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close dialog"
      className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 cursor-pointer"
    >
      <X className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Close dialog</span>
    </button>
  );
}
