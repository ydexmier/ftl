'use client';
import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { Spinner } from '@components/ui/Spinner';

interface Props {
  userId: string;
  username: string;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function AdminMemoModal({ userId, username, onClose, onSaved, onDeleted }: Props) {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/users/${userId}/memo`)
      .then((r) => r.json())
      .then((data) => {
        const c = data.content ?? '';
        setContent(c);
        setOriginalContent(c || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const save = async () => {
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/memo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur'); return; }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setError('');
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/memo`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur'); return; }
      onDeleted();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            Mémo <span className="text-muted-foreground font-normal">@{username}</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {error && <Alert severity="error">{error}</Alert>}
          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          ) : (
            <>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Votre note privée sur ce joueur…"
                maxLength={2000}
                rows={6}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                autoFocus
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{content.length}/2000</span>
                <div className="flex gap-2">
                  {originalContent && (
                    <Button variant="ghost" size="sm" loading={deleting} onClick={remove} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                      Supprimer
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={onClose}>Annuler</Button>
                  <Button size="sm" loading={saving} disabled={!content.trim()} onClick={save}>
                    Enregistrer
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
