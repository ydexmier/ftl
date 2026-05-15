'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw, Home, ChevronDown } from 'lucide-react';
import { Button } from '@components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const submitReport = async () => {
    setSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bug',
          title: `Erreur : ${error.message?.slice(0, 100) || 'Erreur inconnue'}`,
          description: description.trim() || '(Aucun détail fourni)',
          page: window.location.pathname,
        }),
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 flex flex-col gap-6 shadow-xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/15 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Une erreur est survenue</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quelque chose s&apos;est mal passé. Tu peux réessayer ou retourner à l&apos;accueil.
            </p>
          </div>
          {error.digest && (
            <p className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
              {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={reset} className="w-full gap-2">
            <RotateCcw className="h-4 w-4" />
            Réessayer
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')} className="w-full gap-2">
            <Home className="h-4 w-4" />
            Retour à l&apos;accueil
          </Button>
        </div>

        <div className="border-t border-border pt-4">
          {submitted ? (
            <p className="text-sm text-center text-green-400">Merci, le bug a été signalé.</p>
          ) : (
            <>
              <button
                onClick={() => setReportOpen((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${reportOpen ? 'rotate-180' : ''}`} />
                Signaler ce bug
              </button>

              {reportOpen && (
                <div className="mt-3 flex flex-col gap-3">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décris ce que tu faisais quand l'erreur est survenue… (optionnel)"
                    rows={3}
                    maxLength={500}
                    className="w-full rounded-md border border-white/25 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                  <Button size="sm" onClick={submitReport} loading={submitting}>
                    Envoyer le rapport
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
