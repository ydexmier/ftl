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
  onInvited: () => void;
}

export function InviteMemberModal({ groupId, onClose, onInvited }: Props) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(search, 300);

  const searchUsers = useCallback(async (q: string) => {
    setSearching(true);
    setError('');
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok) {
        setResults(data.users ?? []);
      } else {
        setResults([]);
      }
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

  const invite = async (userId: string, username: string) => {
    setLoading(userId);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(`Invitation envoyée à ${username}`);
      setResults((prev) => prev.filter((u) => u._id !== userId));
      setTimeout(onInvited, 800);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">Inviter un membre</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
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
          {success && <p className="text-sm text-green-400">{success}</p>}

          {results.length > 0 && (
            <ul className="space-y-1 max-h-56 overflow-y-auto">
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

          {search.length >= 3 && results.length === 0 && !searching && (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun utilisateur trouvé.</p>
          )}

          <div className="flex justify-end pt-1">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
