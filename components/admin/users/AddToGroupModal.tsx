'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useDebounce } from '@/src/hooks/useDebounce';

interface GroupResult {
  _id: string;
  name: string;
  memberCount: number;
}

interface Props {
  userId: string;
  excludeGroupIds: string[];
  onClose: () => void;
  onSuccess: (group: { _id: string; name: string }) => void;
}

export function AddToGroupModal({ userId, excludeGroupIds, onClose, onSuccess }: Props) {
  const [search, setSearch] = useState('');
  const [allGroups, setAllGroups] = useState<GroupResult[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(search, 200);

  useEffect(() => {
    fetch('/api/admin/groups')
      .then((r) => r.json())
      .then((data) => setAllGroups(data.groups ?? []))
      .finally(() => {
        setLoadingGroups(false);
        inputRef.current?.focus();
      });
  }, []);

  const filtered = useCallback(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return allGroups.filter(
      (g) => !excludeGroupIds.includes(g._id) && (!q || g.name.toLowerCase().includes(q)),
    );
  }, [allGroups, excludeGroupIds, debouncedSearch]);

  const addToGroup = async (group: GroupResult) => {
    setLoading(group._id);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${userId}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: group._id }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? 'Erreur');
        return;
      }
      onSuccess({ _id: group._id, name: group.name });
    } finally {
      setLoading(null);
    }
  };

  const results = filtered();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Ajouter à un groupe</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <Input
            ref={inputRef}
            fullWidth
            autoFocus
            placeholder="Filtrer par nom de groupe…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {loadingGroups && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loadingGroups && results.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            {allGroups.length === excludeGroupIds.length
              ? 'Cet utilisateur est déjà membre de tous les groupes.'
              : 'Aucun groupe trouvé.'}
          </p>
        )}

        {results.length > 0 && (
          <ul className="space-y-1 max-h-64 overflow-y-auto">
            {results.map((g) => (
              <li key={g._id} className="flex items-center justify-between gap-3 p-2.5 rounded-md border border-border bg-background">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.memberCount} membre{g.memberCount !== 1 ? 's' : ''}</p>
                </div>
                <Button size="sm" loading={loading === g._id} onClick={() => addToGroup(g)}>
                  Ajouter
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  );
}
