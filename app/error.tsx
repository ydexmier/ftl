'use client';
import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
      </div>
    </div>
  );
}
