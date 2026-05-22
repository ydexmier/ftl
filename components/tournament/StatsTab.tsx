'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Spinner } from '@components/ui/Spinner';
import { BarChart2 } from 'lucide-react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface ScoutingProgress {
  total: number;
  fullyScouted: number;
  partiallyScouted: number;
  unscouted: number;
}

interface DeckEntry {
  inks: string[];
  count: number;
}

interface MatchupEntry {
  deckA: string;
  deckB: string;
  winsA: number;
  winsB: number;
}

interface TournamentStats {
  scoutingProgress: ScoutingProgress;
  inkDistribution: DeckEntry[];
  matchupMatrix: {
    decks: string[];
    entries: MatchupEntry[];
  };
}

interface StatsTabProps {
  tournamentId: number;
  groupId?: string | null;
}

const CHART_TEXT_COLOR = '#94a3b8';
const CHART_SPLIT_COLOR = '#1e293b';
const CARD_BG = 'transparent';

const INK_NAMES = ['amber', 'amethyst', 'emerald', 'ruby', 'sapphire', 'steel'];

const RICH_INK_STYLES = Object.fromEntries(
  INK_NAMES.map((ink) => [
    ink,
    { backgroundColor: { image: `/svg/${ink}.svg` }, width: 20, height: 20, align: 'center', verticalAlign: 'middle' },
  ]),
) as Record<string, { backgroundColor: { image: string }; width: number; height: number; align: string; verticalAlign: string }>;

function deckToRichLabel(deckKey: string): string {
  return deckKey.split('/').map((ink) => `{${ink.toLowerCase()}|}`).join('');
}

const FR: Record<string, string> = {
  Amber: 'Ambre', Amethyst: 'Améthyste', Emerald: 'Émeraude',
  Ruby: 'Rubis', Sapphire: 'Saphir', Steel: 'Acier',
};

function deckToFrench(deckKey: string): string {
  return deckKey.split('/').map((ink) => FR[ink] ?? ink).join(' / ');
}

function buildDonutOption(progress: ScoutingProgress) {
  const { total, fullyScouted, partiallyScouted, unscouted } = progress;
  return {
    backgroundColor: CARD_BG,
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' },
      formatter: (params: { name: string; value: number; percent: number }) =>
        `${params.name}<br/><b>${params.value}</b> joueur${params.value > 1 ? 's' : ''} (${params.percent}%)`,
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: { color: CHART_TEXT_COLOR, fontSize: 12 },
    },
    graphic: total > 0 ? [
      {
        type: 'text',
        left: 'center',
        top: '38%',
        style: {
          text: `${Math.round((fullyScouted / total) * 100)}%`,
          textAlign: 'center',
          fill: '#e2e8f0',
          fontSize: 22,
          fontWeight: 'bold',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '52%',
        style: {
          text: 'complets',
          textAlign: 'center',
          fill: CHART_TEXT_COLOR,
          fontSize: 11,
        },
      },
    ] : [],
    series: [
      {
        type: 'pie',
        radius: ['52%', '70%'],
        center: ['50%', '48%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#0f172a', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#e2e8f0' },
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' },
        },
        data: [
          { value: fullyScouted, name: 'Complet', itemStyle: { color: '#22c55e' } },
          { value: partiallyScouted, name: 'Partiel', itemStyle: { color: '#f59e0b' } },
          { value: unscouted, name: 'Non scouté', itemStyle: { color: '#334155' } },
        ],
      },
    ],
  };
}

function buildBarOption(distribution: DeckEntry[]) {
  const sorted = [...distribution].reverse();
  const distributionTotal = sorted.reduce((sum, d) => sum + d.count, 0);
  return {
    backgroundColor: CARD_BG,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' },
      formatter: (params: Array<{ name: string; value: number }>) => {
        const pct = distributionTotal > 0 ? Math.round((params[0].value / distributionTotal) * 100) : 0;
        return `${deckToFrench(params[0].name)}<br/><b>${params[0].value}</b> joueur${params[0].value > 1 ? 's' : ''} <b>(${pct}%)</b>`;
      },
    },
    grid: { left: 16, right: 60, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: CHART_TEXT_COLOR, fontSize: 11 },
      splitLine: { lineStyle: { color: CHART_SPLIT_COLOR } },
      minInterval: 1,
    },
    yAxis: {
      type: 'category',
      data: sorted.map((d) => d.inks.join('/')),
      axisLabel: {
        interval: 0,
        formatter: (value: string) => deckToRichLabel(value),
        rich: RICH_INK_STYLES,
      },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: sorted.map((d) => d.count),
        itemStyle: { color: '#6366f1', borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right',
          color: CHART_TEXT_COLOR,
          fontSize: 11,
          formatter: (params: { value: number }) => {
            const pct = distributionTotal > 0 ? Math.round((params.value / distributionTotal) * 100) : 0;
            return `${params.value}  (${pct}%)`;
          },
        },
        barMaxWidth: 28,
      },
    ],
  };
}

function buildHeatmapOption(decks: string[], entries: MatchupEntry[]) {
  const n = decks.length;

  // Global win rate per deck across all recorded matchups
  const globalRates = new Map<string, number>();
  for (const deck of decks) {
    let totalWins = 0;
    let totalGames = 0;
    for (const e of entries) {
      if (e.deckA === deck) { totalWins += e.winsA; totalGames += e.winsA + e.winsB; }
      else if (e.deckB === deck) { totalWins += e.winsB; totalGames += e.winsA + e.winsB; }
    }
    if (totalGames > 0) globalRates.set(deck, Math.round((totalWins / totalGames) * 100));
  }

  const rateRich = {
    rHigh: { color: '#22c55e', fontSize: 10, fontWeight: 'bold', verticalAlign: 'middle' },
    rMid:  { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', verticalAlign: 'middle' },
    rLow:  { color: '#ef4444', fontSize: 10, fontWeight: 'bold', verticalAlign: 'middle' },
  };

  const yAxisFormatter = (value: string) => {
    const rate = globalRates.get(value);
    if (rate === undefined) return deckToRichLabel(value);
    const rStyle = rate >= 55 ? 'rHigh' : rate <= 45 ? 'rLow' : 'rMid';
    return `${deckToRichLabel(value)}{${rStyle}| ${rate}%}`;
  };

  type HeatCell = { value: [number, number, number | null]; rowDeck: string; colDeck: string; rowWins: number; colWins: number; total: number };
  const data: HeatCell[] = [];

  for (let yi = 0; yi < n; yi++) {
    for (let xi = 0; xi < n; xi++) {
      const row = decks[yi];
      const col = decks[xi];

      if (xi === yi) {
        data.push({ value: [xi, yi, null], rowDeck: row, colDeck: col, rowWins: 0, colWins: 0, total: 0 });
        continue;
      }

      const entry = entries.find(
        (e) => (e.deckA === row && e.deckB === col) || (e.deckA === col && e.deckB === row),
      );

      if (!entry) {
        data.push({ value: [xi, yi, null], rowDeck: row, colDeck: col, rowWins: 0, colWins: 0, total: 0 });
        continue;
      }

      const total = entry.winsA + entry.winsB;
      const rowWins = entry.deckA === row ? entry.winsA : entry.winsB;
      const colWins = entry.deckA === row ? entry.winsB : entry.winsA;
      const winRate = total > 0 ? Math.round((rowWins / total) * 100) : null;

      data.push({ value: [xi, yi, winRate], rowDeck: row, colDeck: col, rowWins, colWins, total });
    }
  }

  return {
    backgroundColor: CARD_BG,
    tooltip: {
      show: true,
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      formatter: (params: { data: HeatCell }) => {
        const { rowDeck, colDeck, rowWins, colWins, total, value } = params.data;
        if (rowDeck === colDeck) return `${deckToFrench(rowDeck)}<br/>Miroir`;
        if (total === 0) return `${deckToFrench(rowDeck)} vs ${deckToFrench(colDeck)}<br/><span style="color:#64748b">Aucune donnée</span>`;
        const rate = value[2] ?? 0;
        const rateColor = rate >= 60 ? '#22c55e' : rate <= 40 ? '#ef4444' : '#94a3b8';
        return [
          `<b>${deckToFrench(rowDeck)}</b> vs <b>${deckToFrench(colDeck)}</b>`,
          `Manches : <b>${rowWins}</b>V / <b>${colWins}</b>D (${total} au total)`,
          `Taux : <b style="color:${rateColor}">${rate}%</b>`,
        ].join('<br/>');
      },
    },
    grid: { left: 8, right: 8, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category',
      position: 'top',
      data: decks,
      axisLabel: {
        interval: 0,
        formatter: (value: string) => deckToRichLabel(value),
        rich: RICH_INK_STYLES,
      },
      axisTick: { show: false },
      splitArea: { show: true, areaStyle: { color: ['#0f172a', '#111827'] } },
    },
    yAxis: {
      type: 'category',
      data: decks,
      axisLabel: {
        interval: 0,
        formatter: yAxisFormatter,
        rich: { ...RICH_INK_STYLES, ...rateRich },
      },
      axisTick: { show: false },
      splitArea: { show: true, areaStyle: { color: ['#0f172a', '#111827'] } },
    },
    visualMap: {
      min: 0,
      max: 100,
      show: false,
      inRange: {
        color: ['#7f1d1d', '#1e293b', '#14532d'],
        opacity: [0.9, 0.4, 0.9],
      },
    },
    series: [
      {
        type: 'heatmap',
        data,
        label: {
          show: true,
          formatter: (params: { data: HeatCell }) => {
            const v = params.data.value[2];
            if (v === null) return '';
            return `${v}%`;
          },
          color: '#e2e8f0',
          fontSize: 11,
          fontWeight: 'bold',
        },
        emphasis: {
          itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.5)' },
        },
        itemStyle: {
          borderColor: '#0f172a',
          borderWidth: 1,
        },
      },
    ],
  };
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
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (groupId) params.set('groupId', groupId);
    fetch(`/api/tournaments/${tournamentId}/stats?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [tournamentId, groupId]);

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
      {/* Scouting progress */}
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

      {/* Ink distribution */}
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

      {/* Matchup matrix */}
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
