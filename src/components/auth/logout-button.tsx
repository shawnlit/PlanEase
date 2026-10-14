'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState<string | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      router.push('/auth/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign out.');
      setIsLoggingOut(false);
    }
  };

  const initials = (email?.slice(0, 1) || '?').toUpperCase();

  return (
    <div className="relative flex items-center gap-1">
      {error && <span role="alert" className="hidden text-xs text-red-700 sm:inline dark:text-red-400">{error}</span>}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-2 px-2"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Account ${email ?? ''}`}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
          {initials}
        </span>
        <span className="hidden max-w-40 truncate text-xs sm:inline">{email ?? 'Account'}</span>
      </Button>
      {isOpen && (
        <div className="absolute right-0 top-10 z-50 min-w-52 rounded-md border border-zinc-200 bg-card p-1 shadow-lg dark:border-zinc-800">
          <div className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
            Signed in as
            <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">{email ?? 'Account'}</div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={handleLogout}
            disabled={isLoggingOut}
            role="menuitem"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            {isLoggingOut ? 'Signing out...' : 'Sign out'}
          </Button>
        </div>
      )}
    </div>
  );
}
