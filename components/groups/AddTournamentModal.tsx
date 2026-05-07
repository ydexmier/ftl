'use client';
import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

interface TournamentOption {
  id: number;
  name: string;
  event_status: string;
}

interface GroupTournamentEntry {
  _id: string;
  tournamentId: number;
  addedBy: string;
  createdAt: string;
  name: string;
  eventStatus: string;
  startDatetime: string;
}

interface Props {
  groupId: string;
  existingIds: number[];
  onClose: () => void;
  onAdded: (entry: GroupTournamentEntry) => void;
}

export function AddTournamentModal({ groupId, existingIds, onClose, onAdded }: Props) {
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/tournaments').then((r) => r.json()).then((d) => setTournaments(d ?? []));
  }, []);

  const filtered = tournaments.filter(
    (t) =>
      !existingIds.includes(t.id) &&
      t.name.toLowerCase().includes(search.toLowerCase()),
  );

  const add = async (t: TournamentOption) => {
    setLoading(t.id);
    setError('');
    try {
      const res = await fetch(`/api/groups/${groupId}/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: t.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onAdded({
        _id: String(data._id),
        tournamentId: t.id,
        addedBy: data.addedBy,
        createdAt: data.createdAt,
        name: t.name,
        eventStatus: t.event_status,
        startDatetime: '',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">Ajouter un tournoi</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              className="h-9 w-full rounded-md border border-white/25 bg-card pl-9 pr-3 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="Filtrer les tournois…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <ul className="space-y-1 max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun tournoi disponible.</p>
            ) : (
              filtered.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 p-2.5 rounded-md border border-border bg-background">
                  <span className="text-sm font-medium text-foreground truncate">{t.name}</span>
                  <Button size="sm" loading={loading === t.id} onClick={() => add(t)}>
                    Ajouter
                  </Button>
                </li>
              ))
            )}
          </ul>

          <div className="flex justify-end pt-1">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
