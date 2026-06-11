'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import Ink from '@components/ui/Ink';
import { Spinner } from '@components/ui/Spinner';

interface DeckConfirmModalProps {
  open: boolean;
  onClose: () => void;
  playerName: string;
  deck: string[];
  onConfirm: () => Promise<void>;
}

export function DeckConfirmModal({ open, onClose, playerName, deck, onConfirm }: DeckConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center md:p-4"
        onClick={onClose}
      >
        <div
          className={[
            'bg-card border-border w-full flex flex-col',
            'rounded-t-2xl border-t border-x md:rounded-xl md:border md:max-w-sm md:shadow-xl',
          ].join(' ')}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle mobile */}
          <div className="flex justify-center pt-3 pb-1 md:hidden" aria-hidden>
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0">
            <h2 className="font-semibold text-foreground">Confirmer le deck</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors ml-3 p-1"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <hr className="border-border mx-5 shrink-0" />

          <div className="px-5 py-4 flex flex-col gap-5">
            <p className="text-sm text-muted-foreground">
              Assigner ce deck à <span className="font-medium text-foreground">{playerName}</span> ?
            </p>

            <div className="flex justify-center">
              <div className="flex">
                {deck.map((ink) => <Ink key={ink} type={ink} width={44} />)}
                {deck.length === 1 && <Ink type="" width={44} />}
              </div>
            </div>

            <div className="flex gap-3 pb-[max(0px,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 h-9 rounded-md border border-white/25 text-sm text-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Spinner size="sm" />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
