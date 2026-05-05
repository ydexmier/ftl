'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { getRoundName } from '@/src/domain/rules/roundRules';
import Round from '@components/round/Round';
import { useTournament } from '@/src/hooks/useTournament';
import FetchButton from '@components/ui/FetchButton';
import { Spinner } from '@components/ui/Spinner';

interface TournamentProps {
	id: number | string;
}

export default function Tournament({ id }: TournamentProps) {
	const searchParams = useSearchParams();
	const queryRoundId = searchParams.get('roundId') ?? '';
	const queryPage = searchParams.get('page') ?? 1;
	const queryPerPage = searchParams.get('perPage') ?? 10;
	const querySearch = searchParams.get('search') ?? '';

	const [roundId, setRoundId] = useState(queryRoundId);

	const { tournament, loading, error, refreshTournament } = useTournament(Number(id));
	const { updatedAt } = (tournament as { updatedAt?: string }) || {};

	const handleRoundChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		if (value) setRoundId(value);
	};

	if (loading) {
		return (
			<div className="flex justify-center py-20">
				<Spinner size="lg" />
			</div>
		);
	}
	if (error) return <p className="text-destructive">Erreur : {String(error)}</p>;
	if (!tournament) return <p className="text-muted-foreground">Aucune donnée disponible.</p>;

	// Build options for round select
	const roundOptions = (tournament as any).tournament_phases?.flatMap((phase: any) =>
		(phase.rounds ?? []).map((round: any) => ({
			value: round.id,
			label: getRoundName(phase, round),
		})),
	) ?? [];

	return (
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
					lastUpdate={updatedAt as unknown as null}
				/>
			</div>

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

			{roundId && (
				<Round
					roundId={roundId}
					page={queryPage}
					perPage={queryPerPage}
					search={querySearch}
				/>
			)}
		</div>
	);
}
