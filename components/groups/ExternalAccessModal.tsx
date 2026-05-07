'use client';
import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

interface UserResult {
  _id: string;
  username: string;
  email: string;
}

interface Props {
  groupId: string;
  tournamentId: number;
  tournamentName: string;
  onClose: () => void;
}

export function ExternalAccessModal({ groupId, tournamentId, tournamentName, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const searchUsers = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}&limit=10`);
      const data = await res.json();
      setResults(data.users ?? []);
    } finally {
      setSearching(false);
    }
  };

  const invite = async (userId: string, username: string) => {
    setLoading(userId);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/groups/${groupId}/tournaments/${tournamentId}/external-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          expiresAt: expiresAt || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(`Invitation envoyée à ${username}`);
      setResults((prev) => prev.filter((u) => u._id !== userId));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground">Accès externe</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{tournamentName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Invitez un utilisateur externe à consulter et saisir le scouting de ce tournoi uniquement.
          </p>

          <Input
            label="Date d'expiration (optionnel)"
            type="date"
            fullWidth
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
          />

          <div className="flex gap-2">
            <Input
              fullWidth
              placeholder="Rechercher par nom ou email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            />
            <Button variant="outline" loading={searching} onClick={searchUsers}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-400">{success}</p>}

          {results.length > 0 && (
            <ul className="space-y-1 max-h-48 overflow-y-auto">
              {results.map((u) => (
                <li key={u._id} className="flex items-center justify-between gap-3 p-2.5 rounded-md border border-border bg-background">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{u.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <Button size="sm" loading={loading === u._id} onClick={() => invite(u._id, u.username)}>
                    Inviter
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end pt-1">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
