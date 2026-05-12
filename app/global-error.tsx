'use client';
import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
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
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-[oklch(0.145_0_0)] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-[oklch(0.205_0_0)] border border-white/10 rounded-xl p-8 flex flex-col gap-6 shadow-xl text-white">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Erreur critique</h1>
              <p className="text-sm text-white/60 mt-1">
                L&apos;application a rencontré une erreur inattendue.
              </p>
            </div>
            {error.digest && (
              <p className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded">
                {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md text-sm font-medium bg-white text-black hover:bg-white/90 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Réessayer
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="inline-flex items-center justify-center h-9 px-4 rounded-md text-sm font-medium border border-white/20 hover:bg-white/10 transition-colors"
            >
              Retour à l&apos;accueil
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
