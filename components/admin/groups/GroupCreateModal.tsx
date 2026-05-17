'use client';
import { useState } from 'react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function GroupCreateModal({ onClose, onSuccess }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) { setError('Le nom est requis'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
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
        <h2 className="text-lg font-semibold text-foreground">Créer un groupe</h2>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-3">
          <Input
            label="Nom du groupe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            fullWidth
            autoFocus
          />
          <Input
            label="Description (optionnel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
          />
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
          <Button onClick={submit} disabled={loading}>{loading ? 'Création…' : 'Créer'}</Button>
        </div>
      </div>
    </div>
  );
}
