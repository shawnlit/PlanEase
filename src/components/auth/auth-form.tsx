'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(
    searchParams.get('error') === 'confirmation_failed'
      ? 'The confirmation link could not be completed. Please try again.'
      : null
  );
  const [error, setError] = React.useState<string | null>(null);

  const isSignup = mode === 'signup';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const result = isSignup
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (isSignup && !result.data.session) {
        setMessage('Check your email to confirm your account before signing in.');
        return;
      }

      window.location.assign(searchParams.get('next') || '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md border-zinc-300 dark:border-zinc-700">
        <CardHeader className="border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-lime-800 dark:text-lime-300">PlanEase / private workspace</div>
          <CardTitle className="text-2xl font-semibold leading-snug">{isSignup ? 'Create your PlanEase account' : 'Sign in to PlanEase'}</CardTitle>
          <CardDescription>
            {isSignup
              ? 'Create an account to keep your tasks private.'
              : 'Sign in to access your private task list.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input
                id="password"
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {message && <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p>}
            {error && <p role="alert" className="text-sm text-red-700 dark:text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-zinc-600 dark:text-zinc-400">
            {isSignup ? 'Already have an account?' : 'Need an account?'}{' '}
            <Link
              className="font-medium text-zinc-900 underline dark:text-zinc-100"
              href={isSignup ? '/auth/login' : '/auth/signup'}
            >
              {isSignup ? 'Sign in' : 'Sign up'}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
