'use client';
import { useState } from 'react';
import { Button } from '@components/ui/Button';

interface Props {
  groupId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTournamentModal({ groupId, onClose, onSuccess }: Props) {
  const [tournamentId, setTournamentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const id = Number(tournamentId);
    if (!id || id <= 0) { setError('ID de tournoi invalide'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: id }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? 'Erreur');
        return;
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">Lier un tournoi</h2>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <input
          className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="ID du tournoi (ex: 12345)"
          type="number"
          value={tournamentId}
          onChange={(e) => setTournamentId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
          <Button onClick={submit} disabled={loading}>{loading ? 'Liaison…' : 'Lier'}</Button>
        </div>
      </div>
    </div>
  );
}
