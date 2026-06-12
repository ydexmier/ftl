import { Spinner } from '@components/ui/Spinner';
import Ink from '@components/ui/Ink';
import type { PlayerHistoryEntry, PlayerHistoryResult } from '@/src/types/player';

const RESULT_STYLE: Record<PlayerHistoryResult, { label: string; className: string }> = {
  WIN:     { label: 'Victoire', className: 'text-emerald-400 font-semibold' },
  LOSS:    { label: 'Défaite',  className: 'text-red-400 font-semibold' },
  DRAW:    { label: 'Égalité', className: 'text-blue-400 font-semibold' },
  BYE:     { label: 'BYE',     className: 'text-muted-foreground' },
  PENDING: { label: 'En cours', className: 'text-amber-400' },
};

interface PlayerHistoryProps {
  entries: PlayerHistoryEntry[];
  loading: boolean;
  error?: string | null;
}

export function PlayerHistory({ entries, loading, error }: PlayerHistoryProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive text-sm py-4">{error}</p>;
  }

  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        Aucune ronde disputée pour ce tournoi.
      </p>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      {entries.map((entry) => {
        const { label, className } = RESULT_STYLE[entry.result];
        const score =
          entry.result !== 'BYE' && entry.result !== 'PENDING' &&
          entry.gamesWon !== null && entry.gamesLost !== null
            ? `${entry.gamesWon}–${entry.gamesLost}`
            : null;

        return (
          <div key={entry.roundId} className="flex items-center gap-3 py-3">
            {/* Round badge */}
            <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">
              Ronde {entry.roundNumber}
            </span>

            {/* Opponent + deck */}
            <div className="flex flex-1 items-center gap-2 min-w-0">
              {entry.opponentDecks.length > 0 && (
                <div className="flex items-center gap-1 shrink-0 self-start mt-0.5">
                  {entry.opponentDecks.map((deck, i) => (
                    <div key={i} className="flex items-center gap-1">
                      {i > 0 && <span className="text-xs text-muted-foreground">OU</span>}
                      <Ink type={deck} width={22} />
                    </div>
                  ))}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {entry.result === 'BYE' ? 'BYE' : (entry.opponentName ?? '—')}
                </p>
                {entry.result !== 'BYE' && entry.opponentPseudo && (
                  <p className="text-xs text-muted-foreground truncate">{entry.opponentPseudo}</p>
                )}
              </div>
            </div>

            {/* Result + score */}
            <div className="text-right shrink-0">
              <p className={`text-sm ${className}`}>{label}</p>
              {score && (
                <p className="text-xs text-muted-foreground">{score}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
