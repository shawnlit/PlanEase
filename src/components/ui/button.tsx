import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-700 focus-visible:ring-offset-2 dark:focus-visible:ring-lime-300 dark:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 border border-transparent',
        destructive:
          'bg-red-800 text-white hover:bg-red-900 dark:bg-red-700 dark:text-white dark:hover:bg-red-600 border border-transparent',
        outline:
          'border border-zinc-300 bg-transparent text-zinc-900 hover:bg-zinc-100 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white',
        secondary:
          'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700',
        ghost:
          'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white',
        link: 'text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100',
        accent:
          'bg-lime-800 text-white hover:bg-lime-900 dark:bg-lime-300 dark:text-lime-950 dark:hover:bg-lime-200',
      },
      size: {
        default: 'h-9 px-3.5 py-1.5',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
