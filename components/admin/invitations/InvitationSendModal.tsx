'use client';
import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Alert } from '@components/ui/Alert';

interface Group {
  _id: string;
  name: string;
}

interface SkippedResult {
  email: string;
  reason: string;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function InvitationSendModal({ onClose, onSuccess }: Props) {
  const [emails, setEmails] = useState(['']);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState('');
  const [skipped, setSkipped] = useState<SkippedResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/groups')
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => {});
  }, []);

  const addEmail = () => setEmails((prev) => [...prev, '']);
  const removeEmail = (i: number) => setEmails((prev) => prev.filter((_, idx) => idx !== i));
  const setEmail = (i: number, val: string) =>
    setEmails((prev) => prev.map((e, idx) => (idx === i ? val : e)));

  const toggleGroup = (id: string) =>
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validEmails = emails.map((e) => e.trim()).filter(Boolean);
    if (validEmails.length === 0) {
      setError('Saisie au moins un email');
      return;
    }
    setError('');
    setSkipped([]);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: validEmails, groupIds: selectedGroups }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur'); return; }
      if (data.skipped?.length > 0) {
        setSkipped(data.skipped);
      }
      if (data.sent > 0) {
        onSuccess();
      } else {
        setError('Aucune invitation envoyée');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-semibold text-foreground">Envoyer des invitations</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-5">
          {error && <Alert severity="error">{error}</Alert>}

          {skipped.length > 0 && (
            <Alert severity="warning">
              <p className="font-medium mb-1">{skipped.length} email(s) ignoré(s) :</p>
              <ul className="text-xs space-y-0.5">
                {skipped.map((s) => (
                  <li key={s.email}><span className="font-mono">{s.email}</span> — {s.reason}</li>
                ))}
              </ul>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Adresses email</label>
            {emails.map((email, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(e) => setEmail(i, e.target.value)}
                  fullWidth
                />
                {emails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEmail(i)}
                    className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addEmail}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter un email
            </button>
          </div>

          {groups.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Groupes à rejoindre <span className="text-muted-foreground font-normal">(optionnel)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <button
                    key={g._id}
                    type="button"
                    onClick={() => toggleGroup(g._id)}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      selectedGroups.includes(g._id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="submit" loading={loading} className="flex-1">
              Envoyer {emails.filter(Boolean).length > 1 ? `les ${emails.filter(Boolean).length} invitations` : "l'invitation"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
