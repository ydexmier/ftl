'use client';
import { X } from 'lucide-react';
import { PlayerHistory } from '@components/match/PlayerHistory';
import { usePlayerHistory } from '@/src/hooks/usePlayerHistory';

interface PlayerHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  tournamentId: number;
  playerId: number;
  playerName: string;
  groupId?: string | null;
}

export function PlayerHistoryDrawer({
  open,
  onClose,
  tournamentId,
  playerId,
  playerName,
  groupId,
}: PlayerHistoryDrawerProps) {
  const { entries, loading, error } = usePlayerHistory(
    tournamentId,
    open ? playerId : null,
    groupId,
  );

  if (!open) return null;

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
            'rounded-t-2xl border-t border-x md:rounded-xl md:border md:max-w-md md:shadow-xl',
            'max-h-[80dvh] overflow-hidden',
          ].join(' ')}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle mobile */}
          <div className="flex justify-center pt-3 pb-1 md:hidden" aria-hidden>
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0">
            <div className="truncate">
              <h2 className="font-semibold text-foreground truncate">{playerName}</h2>
              <p className="text-xs text-muted-foreground">Parcours du tournoi</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-3 p-1"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <hr className="border-border mx-5 shrink-0" />

          <div className="overflow-y-auto px-5 py-2 overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
            <PlayerHistory entries={entries} loading={loading} error={error} />
          </div>
        </div>
      </div>
    </>
  );
}
