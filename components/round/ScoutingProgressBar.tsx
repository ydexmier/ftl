'use client';

import { X } from 'lucide-react';
import type { ScoutingFilter, ScoutingStats } from '@/src/types/round';

interface ScoutingProgressBarProps {
	stats: ScoutingStats;
	activeFilters: ScoutingFilter[];
	onFilter: (filters: ScoutingFilter[]) => void;
}

export function ScoutingProgressBar({ stats, activeFilters, onFilter }: ScoutingProgressBarProps) {
	if (stats.total === 0) return null;

	const fullPct = (stats.full / stats.total) * 100;
	const partialPct = (stats.partial / stats.total) * 100;
	const nonePct = (stats.none / stats.total) * 100;
	const completedPct = Math.round(fullPct);

	const toggle = (f: ScoutingFilter) => {
		if (activeFilters.includes(f)) {
			onFilter(activeFilters.filter((x) => x !== f));
		} else {
			onFilter([...activeFilters, f]);
		}
	};

	const segmentCls = (f: ScoutingFilter, color: string) => {
		const dimmed = activeFilters.length > 0 && !activeFilters.includes(f);
		return `h-full ${color} cursor-pointer transition-opacity duration-150 ${dimmed ? 'opacity-20' : 'hover:opacity-75'}`;
	};

	const legendCls = (f: ScoutingFilter) => {
		const dimmed = activeFilters.length > 0 && !activeFilters.includes(f);
		return `flex items-center gap-1.5 cursor-pointer transition-opacity duration-150 ${dimmed ? 'opacity-35' : 'hover:opacity-70'}`;
	};

	return (
		<div className="mb-4">
			<p className="text-sm font-medium text-foreground mb-1.5">Avancement du scouting</p>
			<div
				className="flex h-4 w-full overflow-hidden rounded-full bg-white/8 gap-px"
				role="group"
				aria-label="Avancement du scouting"
			>
				{stats.full > 0 && (
					<button
						type="button"
						style={{ width: `${fullPct}%`, minWidth: '4px' }}
						onClick={() => toggle('full')}
						className={segmentCls('full', 'bg-green-500')}
						aria-pressed={activeFilters.includes('full')}
						title={`${stats.full} matchs complètement scoutés — cliquer pour filtrer`}
					/>
				)}
				{stats.partial > 0 && (
					<button
						type="button"
						style={{ width: `${partialPct}%`, minWidth: '4px' }}
						onClick={() => toggle('partial')}
						className={segmentCls('partial', 'bg-amber-400')}
						aria-pressed={activeFilters.includes('partial')}
						title={`${stats.partial} matchs partiellement scoutés — cliquer pour filtrer`}
					/>
				)}
				{stats.none > 0 && (
					<button
						type="button"
						style={{ width: `${nonePct}%`, minWidth: '4px' }}
						onClick={() => toggle('none')}
						className={segmentCls('none', 'bg-white/20')}
						aria-pressed={activeFilters.includes('none')}
						title={`${stats.none} matchs non scoutés — cliquer pour filtrer`}
					/>
				)}
			</div>

			<div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
				{stats.full > 0 && (
					<button type="button" onClick={() => toggle('full')} className={legendCls('full')}>
						<span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
						<span className="text-xs text-foreground font-medium">{stats.full}</span>
						<span className="text-xs text-muted-foreground">complets</span>
					</button>
				)}
				{stats.partial > 0 && (
					<button type="button" onClick={() => toggle('partial')} className={legendCls('partial')}>
						<span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
						<span className="text-xs text-foreground font-medium">{stats.partial}</span>
						<span className="text-xs text-muted-foreground">partiels</span>
					</button>
				)}
				{stats.none > 0 && (
					<button type="button" onClick={() => toggle('none')} className={legendCls('none')}>
						<span className="w-2 h-2 rounded-full bg-white/25 shrink-0" />
						<span className="text-xs text-foreground font-medium">{stats.none}</span>
						<span className="text-xs text-muted-foreground">non scoutés</span>
					</button>
				)}
				<span className="text-xs text-muted-foreground ml-auto">{completedPct}% complété</span>
				{activeFilters.length > 0 && (
					<button
						type="button"
						onClick={() => onFilter([])}
						className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
					>
						<X className="w-3 h-3" />
						Réinitialiser
					</button>
				)}
			</div>
		</div>
	);
}
