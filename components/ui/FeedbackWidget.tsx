'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquarePlus, X, Bug, Lightbulb } from 'lucide-react';
import { Button } from './Button';
import { cn } from './cn';

type FeedbackType = 'bug' | 'improvement';

const TYPES: { value: FeedbackType; label: string; icon: React.ElementType }[] = [
  { value: 'bug', label: 'Bug', icon: Bug },
  { value: 'improvement', label: 'Amélioration', icon: Lightbulb },
];

export function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setType('bug');
    setTitle('');
    setDescription('');
    setError('');
    setDone(false);
  };

  const close = () => {
    setOpen(false);
    setTimeout(reset, 300);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, description, page: pathname }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur'); return; }
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="Signaler un bug ou suggérer une amélioration"
        title="Feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={close}
          />
          <div className="fixed bottom-20 right-5 z-50 w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl flex flex-col gap-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Retour utilisateur</h2>
              <button onClick={close} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {done ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-green-900/40 flex items-center justify-center">
                    <span className="text-green-400 text-lg">✓</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Merci pour ton retour !</p>
                    <p className="text-xs text-muted-foreground mt-1">On l&apos;a bien reçu.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={close} className="mt-1">
                    Fermer
                  </Button>
                </div>
              ) : (
                <form onSubmit={submit} className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    {TYPES.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setType(value)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 h-9 rounded-md border text-sm font-medium transition-colors',
                          type === value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-foreground">Titre</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      maxLength={200}
                      placeholder={type === 'bug' ? 'Ex : Le bouton ne répond pas' : 'Ex : Pouvoir filtrer par encre'}
                      className="h-9 rounded-md border border-white/25 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-foreground">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      maxLength={2000}
                      rows={4}
                      placeholder={type === 'bug' ? 'Décris les étapes pour reproduire le problème…' : 'Explique ce que tu voudrais pouvoir faire…'}
                      className="rounded-md border border-white/25 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}

                  <Button type="submit" loading={loading} className="w-full">
                    Envoyer
                  </Button>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
