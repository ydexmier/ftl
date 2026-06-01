'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, HelpCircle } from 'lucide-react';

import { getRoundName } from '@/src/domain/rules/roundRules';
import Round from '@components/round/Round';
import DeckbuildingRound from '@components/round/DeckbuildingRound';
import { useTournament } from '@/src/hooks/useTournament';
import FetchButton from '@components/ui/FetchButton';
import { Spinner } from '@components/ui/Spinner';
import { ConflictResolutionModal, type ConflictGroup } from '@components/tournament/ConflictResolutionModal';
import { TournamentSidebar, type TournamentTab } from '@components/tournament/TournamentSidebar';
import { PlayersTab } from '@components/tournament/PlayersTab';
import { ReportsTab } from '@components/tournament/ReportsTab';
import { TournamentTour } from '@components/ui/TournamentTour';
import { AdminConflictModal } from '@components/groups/AdminConflictModal';
import { UncertaintyModal } from '@components/groups/UncertaintyModal';
import { StatsTab } from '@components/tournament/StatsTab';
import { AdminGroupMenu } from '@components/tournament/AdminGroupMenu';
import type { Tournament as TournamentType } from '@/src/types/tournament';
import type { RoundType } from '@/src/types/round';

interface AdminGroup {
	groupId: string;
	groupName: string;
}

interface AdminConflict {
	_id: string;
	tournamentId: number;
	playerId: number;
	playerName: string;
	previousInks: string[][];
	proposedInks: string[][];
	userId: { _id: string; username: string } | string;
}

interface UncertaintyConflict {
	_id: string;
	tournamentId: number;
	playerId: number;
	playerName: string;
	previousInks: string[][];
	proposedInks: string[][];
}

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
	const [conflicts, setConflicts] = useState<ConflictGroup[]>([]);
	const [showConflictModal, setShowConflictModal] = useState(false);
	const [activeTab, setActiveTab] = useState<TournamentTab>('scouting');
	const [currentUserId, setCurrentUserId] = useState<string>('');
	const [isGuest, setIsGuest] = useState(false);
	const [groupRole, setGroupRole] = useState<'ADMIN' | 'MEMBER' | null>(null);
	const [appRole, setAppRole] = useState<string>('USER');
	const [adminGroups, setAdminGroups] = useState<AdminGroup[]>([]);
	const [hasPendingMerge, setHasPendingMerge] = useState(false);
	const [merging, setMerging] = useState(false);
	const [adminConflicts, setAdminConflicts] = useState<AdminConflict[]>([]);
	const [uncertainties, setUncertainties] = useState<UncertaintyConflict[]>([]);
	const [showAdminConflictModal, setShowAdminConflictModal] = useState(false);
	const [showUncertaintyModal, setShowUncertaintyModal] = useState(false);

	const { tournament, loading, error, refreshTournament } = useTournament(Number(id));
	const { lastFetchedAt } = (tournament as (TournamentType & { lastFetchedAt?: string }) | null) ?? {};

	const fetchUserConflicts = useCallback(async () => {
		const data = await fetch(`/api/tournaments/${id}/conflicts`)
			.then((res) => (res.ok ? res.json() : { conflicts: [] }))
			.catch(() => ({ conflicts: [] }));
		const list: ConflictGroup[] = data.conflicts ?? [];
		setConflicts(list);
		if (list.length > 0) setShowConflictModal(true);
	}, [id]);

	useEffect(() => { fetchUserConflicts(); }, [fetchUserConflicts]);

	useEffect(() => {
		if (roundId || !tournament) return;
		fetch(`/api/tournaments/${id}/last-round`)
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => { if (data?.roundId) setRoundId(String(data.roundId)); })
			.catch(() => {});
	}, [tournament, id, roundId]);

	useEffect(() => {
		fetch('/api/auth/me')
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data?.id) setCurrentUserId(data.id);
				setIsGuest(data?.isGuest ?? false);
			})
			.catch(() => {});
	}, []);

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

	useEffect(() => {
		if (!groupId) return;
		fetch(`/api/groups/${groupId}/tournaments/${id}/merge-status`)
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => { if (data) setHasPendingMerge(data.hasPendingPersonalData); })
			.catch(() => {});
	}, [groupId, id]);

	useEffect(() => {
		if (!groupId || groupRole !== 'ADMIN') return;
		fetch(`/api/groups/${groupId}/conflicts`)
			.then((res) => (res.ok ? res.json() : { conflicts: [] }))
			.then((data) => setAdminConflicts((data.conflicts ?? []).filter((c: AdminConflict) => c.tournamentId === Number(id))))
			.catch(() => {});
	}, [groupId, groupRole, id]);

	useEffect(() => {
		if (!groupId || groupRole !== 'ADMIN') return;
		fetch(`/api/groups/${groupId}/uncertainties`)
			.then((res) => (res.ok ? res.json() : { uncertainties: [] }))
			.then((data) => setUncertainties((data.uncertainties ?? []).filter((c: UncertaintyConflict) => c.tournamentId === Number(id))))
			.catch(() => {});
	}, [groupId, groupRole, id]);

	useEffect(() => {
		fetch(`/api/tournaments/${id}/admin-groups`)
			.then((res) => (res.ok ? res.json() : { groups: [] }))
			.then((data) => setAdminGroups(data.groups ?? []))
			.catch(() => {});
	}, [id]);

	const handleMerge = async () => {
		if (!groupId) return;
		setMerging(true);
		try {
			const res = await fetch(`/api/groups/${groupId}/tournaments/${id}/merge`, { method: 'POST' });
			if (res.ok) {
				setHasPendingMerge(false);
				await fetchUserConflicts();
			}
		} finally {
			setMerging(false);
		}
	};

	const handleConflictResolved = (conflictId: string) => {
		setConflicts((prev) => {
			const next = prev.filter((c) => c._id !== conflictId);
			if (next.length === 0) setShowConflictModal(false);
			return next;
		});
	};

	const handleAdminConflictResolved = (conflictId: string) => {
		setAdminConflicts((prev) => {
			const next = prev.filter((c) => c._id !== conflictId);
			if (next.length === 0) setShowAdminConflictModal(false);
			return next;
		});
	};

	const handleUncertaintyDismissed = (conflictId: string) => {
		setUncertainties((prev) => {
			const next = prev.filter((c) => c._id !== conflictId);
			if (next.length === 0) setShowUncertaintyModal(false);
			return next;
		});
	};

	const selectedRoundType: RoundType | undefined = tournament?.tournament_phases
		?.flatMap((p) => p.rounds ?? [])
		.find((r) => String(r.id) === String(roundId))?.round_type;

	const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		if (value) setRoundId(value);
	};

	const isGroupAdmin = groupRole === 'ADMIN';
	const showReports = !isGuest && groupId !== null && (isGroupAdmin || appRole === 'ADMIN' || appRole === 'SUPERUSER');
	const visibleTabs: TournamentTab[] = ['scouting', 'players', 'stats', ...(showReports ? ['reports' as TournamentTab] : [])];
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

	const roundOptions = tournament.tournament_phases?.flatMap((phase) =>
		phase.rounds.map((round) => ({
			value: round.id,
			label: getRoundName(phase, round),
		})),
	) ?? [];

	const tournamentName = tournament.name;

	return (
		<>
			<TournamentTour />
			{showConflictModal && conflicts.length > 0 && (
				<ConflictResolutionModal
					tournamentId={Number(id)}
					conflicts={conflicts}
					onConflictResolved={handleConflictResolved}
					onClose={() => setShowConflictModal(false)}
				/>
			)}
			{showAdminConflictModal && adminConflicts.length > 0 && groupId && (
				<AdminConflictModal
					groupId={groupId}
					tournamentName={tournamentName}
					conflicts={adminConflicts}
					onConflictResolved={handleAdminConflictResolved}
					onClose={() => setShowAdminConflictModal(false)}
				/>
			)}
			{showUncertaintyModal && uncertainties.length > 0 && (
				<UncertaintyModal
					tournamentName={tournamentName}
					conflicts={uncertainties}
					groupId={groupId ?? ''}
					onDismissed={handleUncertaintyDismissed}
					onClose={() => setShowUncertaintyModal(false)}
				/>
			)}

			<div className="flex flex-col gap-4">
				<div data-tour="tournament-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
					<div className="flex flex-col gap-0.5">
						<h1 className="text-lg sm:text-xl font-bold text-foreground">
							{tournamentName}
						</h1>
						<p className="text-sm text-muted-foreground">
							{tournament.registered_user_count}/{tournament.capacity} joueurs
						</p>
					</div>
					<div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
						{adminGroups.length > 0 && (
							<AdminGroupMenu
								tournamentId={Number(id)}
								tournamentName={tournamentName}
								adminGroups={adminGroups}
							/>
						)}
						<div data-tour="tournament-fetch-btn">
							<FetchButton
								defaultLabel="MAJ Tournoi"
								onFetch={refreshTournament}
								refreshDelay={60}
								lastUpdate={lastFetchedAt}
							/>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap gap-2">
					{conflicts.length > 0 && !showConflictModal && (
						<button
							onClick={() => setShowConflictModal(true)}
							className="inline-flex items-center gap-2 rounded-md border border-yellow-700 bg-yellow-900/20 px-3 py-1.5 text-sm text-yellow-400 hover:bg-yellow-900/40 transition-colors"
						>
							<AlertTriangle className="h-4 w-4 shrink-0" />
							{conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} d&apos;encres en attente
						</button>
					)}
					{isGroupAdmin && adminConflicts.length > 0 && (
						<button
							onClick={() => setShowAdminConflictModal(true)}
							className="inline-flex items-center gap-2 rounded-md border border-yellow-700 bg-yellow-900/20 px-3 py-1.5 text-sm text-yellow-400 hover:bg-yellow-900/40 transition-colors"
						>
							<AlertTriangle className="h-4 w-4 shrink-0" />
							{adminConflicts.length} proposition{adminConflicts.length > 1 ? 's' : ''} à valider
						</button>
					)}
					{isGroupAdmin && uncertainties.length > 0 && (
						<button
							onClick={() => setShowUncertaintyModal(true)}
							className="inline-flex items-center gap-2 rounded-md border border-blue-700 bg-blue-900/20 px-3 py-1.5 text-sm text-blue-400 hover:bg-blue-900/40 transition-colors"
						>
							<HelpCircle className="h-4 w-4 shrink-0" />
							{uncertainties.length} incertitude{uncertainties.length > 1 ? 's' : ''}
						</button>
					)}
				</div>

				{hasPendingMerge && (
					<div className="flex items-center gap-3 rounded-md border border-blue-700 bg-blue-900/20 px-3 py-2 text-sm text-blue-300">
						<AlertTriangle className="h-4 w-4 shrink-0 text-blue-400" />
						<span className="flex-1">Vous avez du scouting personnel à fusionner dans ce groupe.</span>
						<button
							onClick={handleMerge}
							disabled={merging}
							className="shrink-0 rounded-md border border-blue-600 bg-blue-800/40 px-2.5 py-1 text-xs font-medium text-blue-200 hover:bg-blue-700/40 disabled:opacity-50 transition-colors"
						>
							{merging ? 'Fusion…' : 'Fusionner mes données'}
						</button>
					</div>
				)}

				{showSidebar && (
					<div data-tour="tournament-tabs">
						<TournamentSidebar
							activeTab={activeTab}
							onTabChange={setActiveTab}
							visibleTabs={visibleTabs}
						/>
					</div>
				)}

				{activeTab === 'scouting' && (
					<>
						<select
							data-tour="tournament-round-select"
							value={roundId}
							onChange={handleRoundChange}
							className="h-10 sm:h-9 w-full rounded-md border border-white/25 bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
						>
							<option value="">-- sélectionner une round --</option>
							{roundOptions.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</select>

						{roundId && selectedRoundType === 'DECKBUILDING' && (
							<DeckbuildingRound playerCount={tournament.registered_user_count} />
						)}
						{roundId && selectedRoundType !== 'DECKBUILDING' && (
							<Round
								roundId={roundId}
								page={queryPage}
								perPage={queryPerPage}
								search={querySearch}
								groupId={groupId}
								currentUserId={currentUserId}
								isGroupAdmin={isGroupAdmin}
							/>
						)}
					</>
				)}

				{activeTab === 'players' && (
					<PlayersTab
						tournamentId={Number(id)}
						groupId={groupId}
						currentUserId={currentUserId}
						isGroupAdmin={isGroupAdmin}
					/>
				)}

				{activeTab === 'stats' && (
					<StatsTab
						tournamentId={Number(id)}
						groupId={groupId}
					/>
				)}

				{activeTab === 'reports' && groupId && (
					<ReportsTab groupId={groupId} tournamentId={Number(id)} />
				)}
			</div>
		</>
	);
}
