'use client';
import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

interface Props {
  groupId: string;
  tournamentId: number;
  tournamentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExternalAccessModal({ groupId, tournamentId, tournamentName, onClose, onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const invite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/tournaments/${tournamentId}/external-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, expiresAt: expiresAt || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Une erreur est survenue'); return; }
      setSuccess(`Invitation envoyée à ${email}`);
      setEmail('');
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground">Inviter un externe</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{tournamentName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={invite} className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Un lien d&apos;accès temporaire sera envoyé par email. Aucun compte n&apos;est nécessaire.
          </p>

          <Input
            label="Email de l'invité"
            type="email"
            fullWidth
            required
            placeholder="alice@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Date d'expiration (optionnel)"
            type="date"
            fullWidth
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-400">{success}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Fermer</Button>
            <Button type="submit" loading={loading} disabled={!email.trim()}>
              <Send className="h-4 w-4 mr-1.5" />
              Envoyer l&apos;invitation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
