'use client';
import dynamic from 'next/dynamic';
import { Spinner } from '@components/ui/Spinner';
import { BarChart2 } from 'lucide-react';
import { useTournamentStats } from '@/src/hooks/useTournamentStats';
import { buildDonutOption, buildBarOption, buildHeatmapOption } from '@/src/lib/charts/tournamentChartOptions';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface StatsTabProps {
  tournamentId: number;
  groupId?: string | null;
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-border bg-card/50 px-4 py-3 text-center">
      <span className={`text-2xl font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function StatsTab({ tournamentId, groupId }: StatsTabProps) {
  const { stats, loading } = useTournamentStats(tournamentId, groupId);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <BarChart2 className="h-10 w-10 opacity-30" />
        <p className="text-sm">Impossible de charger les statistiques.</p>
      </div>
    );
  }

  const { scoutingProgress, inkDistribution, matchupMatrix } = stats;
  const hasDistribution = inkDistribution.length > 0;
  const hasMatrix = matchupMatrix.decks.length > 0;
  const barHeight = Math.max(160, inkDistribution.length * 44);
  const heatmapSize = Math.max(280, matchupMatrix.decks.length * 56);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground">Avancement du scouting</h2>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Complets" value={scoutingProgress.fullyScouted} color="text-green-400" />
          <StatCard label="Partiels" value={scoutingProgress.partiallyScouted} color="text-amber-400" />
          <StatCard label="Non scoutés" value={scoutingProgress.unscouted} color="text-muted-foreground" />
        </div>
        {scoutingProgress.total > 0 ? (
          <ReactECharts
            option={buildDonutOption(scoutingProgress)}
            style={{ height: 240, width: '100%' }}
            notMerge
          />
        ) : (
          <p className="text-center text-sm text-muted-foreground py-8">Aucun joueur trouvé.</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground">Répartition des bicolorités</h2>
        {hasDistribution ? (
          <ReactECharts
            option={buildBarOption(inkDistribution)}
            style={{ height: barHeight, width: '100%' }}
            notMerge
          />
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune bicolorité complète enregistrée pour ce tournoi.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-sm font-semibold text-foreground">Matrice des matchups</h2>
          <p className="text-xs text-muted-foreground">
            Taux de victoire en ligne contre la colonne. Uniquement les matchs où les deux bicolorités sont connues.
          </p>
        </div>
        {hasMatrix ? (
          <div className="overflow-x-auto">
            <ReactECharts
              option={buildHeatmapOption(matchupMatrix.decks, matchupMatrix.entries)}
              style={{ height: heatmapSize, width: Math.max(300, matchupMatrix.decks.length * 60) }}
              notMerge
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Pas encore de matchs avec les deux bicolorités connues.
          </p>
        )}
      </section>
    </div>
  );
}
