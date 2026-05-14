'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, BarChart2 } from 'lucide-react';

import { getRoundName } from '@/src/domain/rules/roundRules';
import Round from '@components/round/Round';
import DeckbuildingRound from '@components/round/DeckbuildingRound';
import { useTournament } from '@/src/hooks/useTournament';
import FetchButton from '@components/ui/FetchButton';
import { Spinner } from '@components/ui/Spinner';
import { ConflictResolutionModal } from '@components/tournament/ConflictResolutionModal';
import { TournamentSidebar, type TournamentTab } from '@components/tournament/TournamentSidebar';
import { PlayersTab } from '@components/tournament/PlayersTab';
import { ReportsTab } from '@components/tournament/ReportsTab';
import type { RoundType } from '@/src/types/round';

interface TournamentProps {
	id: number | string;
}

export default function Tournament({ id }: TournamentProps) {
	const searchParams = useSearchParams();
	const queryRoundId = searchParams.get('roundId') ?? '';
	const queryPage = searchParams.get('page') ?? 1;
	const queryPerPage = searchParams.get('perPage') ?? 10;
	const querySearch = searchParams.get('search') ?? '';
	const groupId = searchParams.get('groupId') ?? null;

	const [roundId, setRoundId] = useState(queryRoundId);
	const [conflicts, setConflicts] = useState<unknown[]>([]);
	const [showConflictModal, setShowConflictModal] = useState(false);
	const [activeTab, setActiveTab] = useState<TournamentTab>('scouting');
	const [groupRole, setGroupRole] = useState<'ADMIN' | 'MEMBER' | null>(null);
	const [appRole, setAppRole] = useState<string>('USER');

	const { tournament, loading, error, refreshTournament } = useTournament(Number(id));
	const { lastFetchedAt } = (tournament as { lastFetchedAt?: string }) || {};

	useEffect(() => {
		fetch(`/api/tournaments/${id}/conflicts`)
			.then((res) => (res.ok ? res.json() : { conflicts: [] }))
			.then((data) => {
				const list = data.conflicts ?? [];
				setConflicts(list);
				if (list.length > 0) setShowConflictModal(true);
			})
			.catch(() => {});
	}, [id]);

	useEffect(() => {
		if (!groupId) return;
		fetch(`/api/groups/${groupId}/my-role`)
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (!data) return;
				setGroupRole(data.groupRole ?? null);
				setAppRole(data.appRole ?? 'USER');
			})
			.catch(() => {});
	}, [groupId]);

	const handleConflictResolved = (conflictId: string) => {
		setConflicts((prev) => {
			const next = prev.filter((c) => (c as { _id: string })._id !== conflictId);
			if (next.length === 0) setShowConflictModal(false);
			return next;
		});
	};

	const selectedRoundType: RoundType | undefined = (tournament as any)?.tournament_phases
		?.flatMap((p: any) => p.rounds ?? [])
		.find((r: any) => String(r.id) === String(roundId))?.round_type;

	const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		if (value) setRoundId(value);
	};

	// Tabs that are visible based on role
	const showReports = groupId !== null && (groupRole === 'ADMIN' || appRole === 'ADMIN' || appRole === 'SUPERUSER');
	const visibleTabs: TournamentTab[] = ['scouting', 'players', ...(showReports ? ['reports' as TournamentTab] : [])];
	const showSidebar = visibleTabs.length >= 2;

	if (loading) {
		return (
			<div className="flex justify-center py-20">
				<Spinner size="lg" />
			</div>
		);
	}
	if (error) return <p className="text-destructive">Erreur : {String(error)}</p>;
	if (!tournament) return <p className="text-muted-foreground">Aucune donnée disponible.</p>;

	const roundOptions = (tournament as any).tournament_phases?.flatMap((phase: any) =>
		(phase.rounds ?? []).map((round: any) => ({
			value: round.id,
			label: getRoundName(phase, round),
		})),
	) ?? [];

	return (
		<>
			{showConflictModal && conflicts.length > 0 && (
				<ConflictResolutionModal
					tournamentId={Number(id)}
					conflicts={conflicts as any}
					onConflictResolved={handleConflictResolved}
					onClose={() => setShowConflictModal(false)}
				/>
			)}

			<div className="flex flex-col gap-4">
				<div className="flex items-center justify-between gap-4 flex-wrap">
					<h1 className="text-xl font-bold text-foreground">
						Tournoi : {(tournament as any).name}
					</h1>
					<p className="text-sm text-muted-foreground">
						Joueurs : {(tournament as any).registered_user_count}/{(tournament as any).capacity}
					</p>
					<FetchButton
						defaultLabel="MAJ Tournoi"
						onFetch={refreshTournament}
						refreshDelay={60}
						lastUpdate={lastFetchedAt}
					/>
				</div>

				{conflicts.length > 0 && !showConflictModal && (
					<button
						onClick={() => setShowConflictModal(true)}
						className="flex items-center gap-2 self-start rounded-md border border-yellow-700 bg-yellow-900/20 px-3 py-1.5 text-sm text-yellow-400 hover:bg-yellow-900/40 transition-colors"
					>
						<AlertTriangle className="h-4 w-4 shrink-0" />
						{conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} d&apos;encres en attente
					</button>
				)}

				{showSidebar && (
					<TournamentSidebar
						activeTab={activeTab}
						onTabChange={setActiveTab}
						visibleTabs={visibleTabs}
					/>
				)}

				{activeTab === 'scouting' && (
					<>
						<select
							value={roundId}
							onChange={handleRoundChange}
							className="h-9 w-full rounded-md border border-white/25 bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
						>
							<option value="">-- sélectionner une round --</option>
							{roundOptions.map((opt: { value: number; label: string }) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>

						{roundId && selectedRoundType === 'DECKBUILDING' && (
							<DeckbuildingRound playerCount={(tournament as any)?.registered_user_count} />
						)}
						{roundId && selectedRoundType !== 'DECKBUILDING' && (
							<Round
								roundId={roundId}
								page={queryPage}
								perPage={queryPerPage}
								search={querySearch}
								groupId={groupId}
							/>
						)}
					</>
				)}

				{activeTab === 'players' && (
					<PlayersTab tournamentId={Number(id)} groupId={groupId} />
				)}

				{activeTab === 'stats' && (
					<div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
						<BarChart2 className="h-10 w-10 opacity-30" />
						<p className="text-sm">Statistiques bientôt disponibles.</p>
					</div>
				)}

				{activeTab === 'reports' && groupId && (
					<ReportsTab groupId={groupId} tournamentId={Number(id)} />
				)}
			</div>
		</>
	);
}
