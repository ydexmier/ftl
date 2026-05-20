'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Search, ChevronLeft, ChevronRight, Users, Target } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { Spinner } from '@components/ui/Spinner';
import Ink from '@components/ui/Ink';
import { PlayerDeckModal } from '@components/tournament/PlayerDeckModal';
import { useDebounce } from '@/src/hooks/useDebounce';

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

interface ScoutingStats {
  total: number;
  scouted: number;
  unscouted: number;
  coverage: number;
  deckDistribution: { inks: string[]; count: number }[];
}

interface Props {
  groupId: string;
  groupName: string;
  tournamentId: number;
  tournamentName: string;
}

const PER_PAGE_OPTIONS = [
  { value: 10, label: '10 / page' },
  { value: 25, label: '25 / page' },
  { value: 50, label: '50 / page' },
  { value: 100, label: '100 / page' },
];

const DEFAULT_PAGINATION: Pagination = { page: 1, perPage: 25, total: 0, totalPages: 1 };

export function GroupTournamentScoutingPage({ groupId, groupName, tournamentId, tournamentName }: Props) {
  const [stats, setStats] = useState<ScoutingStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selected, setSelected] = useState<PlayerRow | null>(null);

  useEffect(() => {
    setStatsLoading(true);
    fetch(`/api/groups/${groupId}/tournaments/${tournamentId}/scouting-stats`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [groupId, tournamentId]);

  useEffect(() => {
    setPlayersLoading(true);
    const params = new URLSearchParams();
    params.set('groupId', groupId);
    params.set('page', String(page));
    params.set('perPage', String(perPage));
    if (debouncedSearch) params.set('search', debouncedSearch);

    fetch(`/api/tournaments/${tournamentId}/players?${params}`)
      .then((res) => (res.ok ? res.json() : { players: [], pagination: DEFAULT_PAGINATION }))
      .then((data) => {
        setPlayers(data.players ?? []);
        setPagination(data.pagination ?? DEFAULT_PAGINATION);
      })
      .catch(() => setPlayers([]))
      .finally(() => setPlayersLoading(false));
  }, [groupId, tournamentId, page, perPage, debouncedSearch]);

  const handleSaved = (playerId: number, decks: string[][]) => {
    setPlayers((prev) => prev.map((p) => (p.playerId === playerId ? { ...p, decks } : p)));
    setStats((prev) => {
      if (!prev) return prev;
      const wasEmpty = players.find((p) => p.playerId === playerId)?.decks.length === 0;
      const isNowEmpty = decks.length === 0;
      if (wasEmpty && !isNowEmpty) return { ...prev, scouted: prev.scouted + 1, unscouted: prev.unscouted - 1, coverage: Math.round(((prev.scouted + 1) / prev.total) * 100) };
      if (!wasEmpty && isNowEmpty) return { ...prev, scouted: prev.scouted - 1, unscouted: prev.unscouted + 1, coverage: Math.round(((prev.scouted - 1) / prev.total) * 100) };
      return prev;
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePerPage = (value: number) => {
    setPerPage(value);
    setPage(1);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/groups/${groupId}/tournaments`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground shrink-0" />
            <h1 className="text-xl font-bold text-foreground truncate">{tournamentName}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{groupName}</p>
        </div>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="flex justify-center py-6">
          <Spinner size="sm" />
        </div>
      ) : stats ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="flex justify-center mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Joueurs</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="flex justify-center mb-1">
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.scouted}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Scoutés</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="flex justify-center mb-1">
                <div className="h-4 w-4 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground">%</span>
                </div>
              </div>
              <p className={`text-2xl font-bold ${stats.coverage >= 75 ? 'text-green-400' : stats.coverage >= 40 ? 'text-yellow-400' : 'text-foreground'}`}>
                {stats.coverage}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Couverture</p>
            </div>
          </div>

          {stats.deckDistribution.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Top bicolorités scoutées
              </p>
              <div className="flex flex-wrap gap-3">
                {stats.deckDistribution.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Ink type={entry.inks} width={28} />
                    <span className="text-sm font-medium text-foreground">{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Player list */}
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

        {playersLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
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
                        {debouncedSearch ? 'Aucun résultat' : 'Aucun joueur trouvé pour ce tournoi.'}
                      </td>
                    </tr>
                  ) : (
                    players.map((p) => (
                      <tr
                        key={p.playerId}
                        onClick={() => setSelected(p)}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                      >
                        <td className="px-3 sm:px-4 py-2 sm:py-3 max-w-xs">
                          <span className="text-foreground truncate block">
                            {p.event_best_identifier || p.best_identifier}
                          </span>
                          {p.event_best_identifier && p.event_best_identifier !== p.best_identifier && (
                            <span className="text-xs text-muted-foreground truncate block">{p.best_identifier}</span>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                          <div className="flex justify-end gap-2">
                            {p.decks.length === 0 ? (
                              <span className="text-muted-foreground text-xs">—</span>
                            ) : (
                              p.decks.map((deck, i) => <Ink key={i} type={deck} width={32} />)
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
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
          </>
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
    </div>
  );
}
