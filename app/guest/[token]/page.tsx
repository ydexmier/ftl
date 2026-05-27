'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

export default function GuestAccessPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/guest/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token, displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue');
        return;
      }
      router.replace(`/tournaments/${data.tournamentId}?groupId=${data.groupId}&guest=1`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-foreground">Accès invité</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Comment souhaites-tu être affiché dans le scouting ?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Prénom ou pseudo"
            fullWidth
            autoFocus
            placeholder="ex: Alice, Scouter42…"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" fullWidth loading={loading} disabled={!displayName.trim()}>
            Accéder au tournoi
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Aucun compte requis. Ton accès est temporaire.
        </p>
      </div>
    </div>
  );
}
