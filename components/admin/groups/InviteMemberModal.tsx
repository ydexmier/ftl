'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useDebounce } from '@/src/hooks/useDebounce';

interface UserResult {
  _id: string;
  username: string;
  email: string;
}

interface Props {
  groupId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function InviteMemberModal({ groupId, onClose, onSuccess }: Props) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(search, 300);

  const searchUsers = useCallback(async (q: string) => {
    setSearching(true);
    setError('');
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(res.ok ? (data.users ?? []) : []);
    } finally {
      setSearching(false);
      inputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (debouncedSearch.length < 3) {
      setResults([]);
      return;
    }
    searchUsers(debouncedSearch);
  }, [debouncedSearch, searchUsers]);

  const invite = async (userId: string) => {
    setLoading(userId);
    setError('');
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? 'Erreur');
        return;
      }
      onSuccess();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Inviter un membre</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <Input
            ref={inputRef}
            fullWidth
            autoFocus
            placeholder="Rechercher par nom ou email (3 caractères min.)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {results.length > 0 && (
          <ul className="space-y-1 max-h-56 overflow-y-auto">
            {results.map((u) => (
              <li key={u._id} className="flex items-center justify-between gap-3 p-2.5 rounded-md border border-border bg-background">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{u.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <Button size="sm" loading={loading === u._id} onClick={() => invite(u._id)}>
                  Inviter
                </Button>
              </li>
            ))}
          </ul>
        )}

        {search.length >= 3 && results.length === 0 && !searching && (
          <p className="text-sm text-muted-foreground text-center py-2">Aucun utilisateur trouvé.</p>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  );
}
