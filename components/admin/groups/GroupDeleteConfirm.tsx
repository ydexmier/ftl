'use client';
import { useState } from 'react';
import { Button } from '@components/ui/Button';

interface Props {
  groupId: string;
  groupName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function GroupDeleteConfirm({ groupId, groupName, onClose, onSuccess }: Props) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, { method: 'DELETE' });
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
        <h2 className="text-lg font-semibold text-foreground">Supprimer le groupe</h2>
        <p className="text-sm text-muted-foreground">
          Supprimer <span className="font-medium text-foreground">{groupName}</span> ? Cette action est irréversible et supprimera tous les decks, conflits et rapports de scouting associés.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
          <Button variant="destructive" onClick={submit} disabled={loading}>
            {loading ? 'Suppression…' : 'Supprimer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
