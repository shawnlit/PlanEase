import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(timeString: string | null | undefined): string {
  if (!timeString) return '';
  try {
    const clean = timeString.trim().substring(0, 5); // "HH:MM"
    const [hStr, mStr] = clean.split(':');
    let hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr, 10);
    if (isNaN(hours) || isNaN(minutes)) return timeString;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${minutesStr} ${ampm}`;
  } catch {
    return timeString;
  }
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'No deadline';
  try {
    const hasTime = dateString.includes('T');
    const [datePart, rawTime] = dateString.split('T');
    const parts = datePart.split('-');

    let formattedDate = datePart;
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } else {
      const d = new Date(dateString);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    }

    if (hasTime && rawTime) {
      const formattedTime = formatTime(rawTime);
      if (formattedTime) {
        return `${formattedDate} at ${formattedTime}`;
      }
    }

    return formattedDate;
  } catch {
    return dateString;
  }
}

export function isDeadlineOverdue(deadline: string | null | undefined, status: string): boolean {
  if (!deadline || status === 'completed') return false;
  try {
    if (deadline.includes('T')) {
      const target = new Date(deadline);
      if (!isNaN(target.getTime())) {
        return target.getTime() < Date.now();
      }
    }

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
