'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Alert } from '@components/ui/Alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur'); return; }
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Companion</h1>
          <p className="text-muted-foreground text-sm mt-1">Disney Lorcana Tournament Companion</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-xl flex flex-col gap-5">
          {sent ? (
            <>
              <div className="text-center flex flex-col gap-2">
                <div className="w-12 h-12 rounded-full bg-green-900/40 flex items-center justify-center mx-auto">
                  <span className="text-green-400 text-xl">✓</span>
                </div>
                <h2 className="text-lg font-semibold text-foreground">Email envoyé</h2>
                <p className="text-sm text-muted-foreground">
                  Si un compte existe pour <span className="font-mono text-foreground">{email}</span>,
                  tu recevras un lien de réinitialisation valable 1 heure.
                </p>
              </div>
              <Link href="/login" className="text-center text-sm text-primary hover:underline">
                Retour à la connexion
              </Link>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Mot de passe oublié</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Saisis ton adresse email et on t&apos;envoie un lien de réinitialisation.
                </p>
              </div>

              {error && <Alert severity="error">{error}</Alert>}

              <form onSubmit={submit} className="flex flex-col gap-4">
                <Input
                  label="Adresse email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  autoComplete="email"
                />
                <Button type="submit" loading={loading} className="w-full">
                  Envoyer le lien
                </Button>
              </form>

              <Link href="/login" className="text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                Retour à la connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
