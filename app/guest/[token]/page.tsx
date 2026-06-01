'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

export default function GuestAccessPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/guest/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token, username, email, password }),
      });
      if (!res.ok) {
        let message = 'Une erreur est survenue';
        try { message = (await res.json()).error ?? message; } catch { /* pas de corps JSON */ }
        setError(message);
        return;
      }
      router.replace('/guest/pending');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = username.trim() && email.trim() && password.trim();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted border border-border">
              <Trophy className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground">Créer un compte invité</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Tu as été invité à scouter un tournoi. Crée un compte pour accéder à l&apos;application.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Pseudo"
            fullWidth
            autoFocus
            placeholder="ex: alice42"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
          />
          <Input
            label="Email"
            type="email"
            fullWidth
            placeholder="toi@exemple.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Mot de passe"
            type="password"
            fullWidth
            placeholder="12 caractères minimum"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" loading={loading} disabled={!canSubmit}>
            Créer mon compte
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Ton accès doit être validé par un admin avant de pouvoir accéder au tournoi.
        </p>
      </div>
    </div>
  );
}
