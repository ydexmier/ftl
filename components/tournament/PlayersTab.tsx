'use client';
import { useEffect, useState } from 'react';
import { useDebounce } from '@/src/hooks/useDebounce';
import { Search, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { Spinner } from '@components/ui/Spinner';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import Ink from '@components/ui/Ink';
import { PlayerDeckModal } from './PlayerDeckModal';
import { PlayerCommentHistory } from '@components/ui/PlayerCommentHistory';

interface PlayerRow {
  playerId: number;
  best_identifier: string;
  event_best_identifier: string;
  decks: string[][];
}

interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

interface PlayersTabProps {
  tournamentId: number;
  groupId?: string | null;
  currentUserId: string;
  isGroupAdmin?: boolean;
}

const PER_PAGE_OPTIONS = [
  { value: 10, label: '10 / page' },
  { value: 25, label: '25 / page' },
  { value: 50, label: '50 / page' },
  { value: 100, label: '100 / page' },
];

const DEFAULT_PAGINATION: Pagination = { page: 1, perPage: 25, total: 0, totalPages: 1 };

export function PlayersTab({ tournamentId, groupId, currentUserId, isGroupAdmin = false }: PlayersTabProps) {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selected, setSelected] = useState<PlayerRow | null>(null);
  const [historyPlayer, setHistoryPlayer] = useState<PlayerRow | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (groupId) params.set('groupId', groupId);
    params.set('page', String(page));
    params.set('perPage', String(perPage));
    if (debouncedSearch) params.set('search', debouncedSearch);

    fetch(`/api/tournaments/${tournamentId}/players?${params}`)
      .then((res) => (res.ok ? res.json() : { players: [], pagination: DEFAULT_PAGINATION, commentCounts: {} }))
      .then((data) => {
        setPlayers(data.players ?? []);
        setPagination(data.pagination ?? DEFAULT_PAGINATION);
        setCommentCounts(data.commentCounts ?? {});
      })
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, [tournamentId, groupId, page, perPage, debouncedSearch]);

  const handleSaved = (playerId: number, decks: string[][], commentSaved: boolean) => {
    setPlayers((prev) => prev.map((p) => (p.playerId === playerId ? { ...p, decks } : p)));
    if (commentSaved) {
      setCommentCounts((prev) => ({ ...prev, [playerId]: (prev[playerId] ?? 0) + 1 }));
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePerPage = (value: number) => {
    setPerPage(value);
    setPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!loading && pagination.total === 0 && !debouncedSearch) {
    return (
      <p className="text-sm text-muted-foreground text-center py-16">
        Aucun joueur trouvé pour ce tournoi.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher un joueur…"
              className="w-full h-10 sm:h-9 rounded-md border border-white/25 bg-card pl-9 pr-3 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
          <Select
            options={PER_PAGE_OPTIONS}
            value={perPage}
            onChange={(e) => handlePerPage(Number(e.target.value))}
            className="w-full sm:w-32 sm:shrink-0"
          />
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Joueur
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Bicolorité
                </th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Aucun résultat
                  </td>
                </tr>
              ) : (
                players.map((p) => {
                  const count = commentCounts[p.playerId] ?? 0;
                  return (
                    <tr
                      key={p.playerId}
                      onClick={() => setSelected(p)}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                    >
                      <td className="px-3 sm:px-4 py-2 sm:py-3 max-w-xs">
                        <span className="text-foreground truncate block">{p.event_best_identifier || p.best_identifier}</span>
                        {p.event_best_identifier && p.event_best_identifier !== p.best_identifier && (
                          <span className="text-xs text-muted-foreground truncate block">{p.best_identifier}</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <div className="flex justify-end items-center gap-3">
                          {count > 0 && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setHistoryPlayer(p); }}
                              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={`${count} commentaire${count > 1 ? 's' : ''}`}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <span className="text-xs tabular-nums">{count}</span>
                            </button>
                          )}
                          <div className="flex gap-2">
                            {p.decks.length === 0 ? (
                              <span className="text-muted-foreground text-xs">—</span>
                            ) : (
                              p.decks.map((deck, i) => <Ink key={i} type={deck} width={32} />)
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Page {pagination.page} sur {pagination.totalPages}
              <span className="hidden sm:inline"> · {pagination.total} joueur{pagination.total > 1 ? 's' : ''}</span>
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPage(pagination.page - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(pagination.page + 1)}
              >
                Suivant
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <PlayerDeckModal
        player={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onSaved={handleSaved}
        tournamentId={tournamentId}
        groupId={groupId}
      />

      <PlayerCommentHistory
        open={!!historyPlayer}
        onClose={() => setHistoryPlayer(null)}
        tournamentId={tournamentId}
        playerId={historyPlayer?.playerId ?? 0}
        playerName={historyPlayer?.event_best_identifier || historyPlayer?.best_identifier || ''}
        groupId={groupId}
        currentUserId={currentUserId}
        isGroupAdmin={isGroupAdmin}
        onCommentAdded={() => {
          if (!historyPlayer) return;
          setCommentCounts((prev) => ({ ...prev, [historyPlayer.playerId]: (prev[historyPlayer.playerId] ?? 0) + 1 }));
        }}
      />
    </>
  );
}
