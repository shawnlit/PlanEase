'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

  return (
    <div className="flex items-center gap-1">
      {error && <span role="alert" className="hidden text-xs text-red-700 sm:inline dark:text-red-400">{error}</span>}
      <Button type="button" variant="ghost" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
        {isLoggingOut ? 'Signing out...' : 'Sign out'}
      </Button>
    </div>
  );
}
