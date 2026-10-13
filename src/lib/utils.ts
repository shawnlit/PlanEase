import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'No deadline';
  try {
    // If date is YYYY-MM-DD
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function isDeadlineOverdue(deadline: string | null | undefined, status: string): boolean {
  if (!deadline || status === 'completed') return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = deadline.split('T')[0].split('-');
    if (parts.length === 3) {
      const target = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      );
      return target.getTime() < today.getTime();
    }
    const target = new Date(deadline);
    target.setHours(0, 0, 0, 0);
    return target.getTime() < today.getTime();
  } catch {
    return false;
  }
}

export function isDeadlineToday(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  try {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return deadline.startsWith(todayStr);
  } catch {
    return false;
  }
}
