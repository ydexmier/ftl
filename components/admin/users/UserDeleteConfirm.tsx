'use client';
import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';

interface Props {
  userId: string;
  username: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserDeleteConfirm({ userId, username, onClose, onSuccess }: Props) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const confirm = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Erreur');
        return;
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Supprimer l&apos;utilisateur</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {error && <Alert severity="error">{error}</Alert>}
          <div className="flex gap-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-destructive/15 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Supprimer <span className="font-medium text-foreground">@{username}</span> ? Cette action est irréversible. Toutes les sessions actives seront révoquées.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" loading={loading} onClick={confirm} className="flex-1">Supprimer</Button>
            <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
