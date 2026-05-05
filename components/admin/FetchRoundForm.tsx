'use client';
import { useState } from 'react';
import { getRoundName } from '@/src/domain/rules/roundRules';
import { fetchRound } from 'lib/api/fetchRound';
import { FETCH_ALL_ASYNC } from '@/src/lib/constants';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import type { Tournament, TournamentPhase } from '@/src/types/tournament';

const useAsyncFetch = process.env.NEXT_PUBLIC_USE_ASYNC_FETCH === 'true';

interface FetchRoundFormProps {
	tournament: Tournament;
	phases?: TournamentPhase[];
}

export default function FetchRoundForm({ tournament, phases = [] }: FetchRoundFormProps) {
	const [loadingId, setLoadingId] = useState<number | null>(null);
	const [message, setMessage] = useState('');
	const [round, setRound] = useState<number | undefined>();

	const handleRunRound = async (page: number, perPage: number) => {
		if (!round) return;
		setLoadingId(round);
		setMessage('');
		try {
			await fetchRound(tournament.id, round, { page, perPage });
			setMessage(`✅ Script exécuté pour le round ${round}`);
		} catch (err) {
			setMessage(`❌ ${(err as Error).message}`);
		} finally {
			setLoadingId(null);
		}
	};

	const fetchAllMatchs = async () => {
		if (!round) return;
		setLoadingId(round);
		setMessage('');
		try {
			await fetchRound(tournament.id, round, {
				perPage: useAsyncFetch ? FETCH_ALL_ASYNC.perPage : 2000,
				mode: useAsyncFetch ? FETCH_ALL_ASYNC.mode : undefined,
				excludeOnePlayerMatches: true,
			});
			setMessage('✅ Tous les matchs ont été fetchés');
		} catch (err) {
			setMessage(`❌ ${(err as Error).message}`);
		} finally {
			setLoadingId(null);
		}
	};

	if (phases.length === 0) {
		return <p className="text-sm text-muted-foreground">Aucune phase de tournoi disponible</p>;
	}

	return (
		<div className="flex flex-col gap-4">
			{phases.map((phase, idx) => (
				<div key={idx} className="flex flex-col gap-2">
					<p className="text-sm font-medium text-foreground">
						Phase : {phase.name} ({phase.round_type})
					</p>
					{phase.rounds.length === 0 ? (
						<p className="text-sm text-muted-foreground">Aucune round disponible</p>
					) : (
						<>
							<div className="flex flex-wrap items-center gap-2">
								<select
									value={round ?? ''}
									onChange={(e) => setRound(Number(e.target.value))}
									className="h-9 rounded-md border border-white/25 bg-card px-3 text-sm text-foreground"
								>
									<option value="" disabled>Choisir un round</option>
									{phase.rounds.map((r) => (
										<option key={r.id} value={r.id}>
											{getRoundName(phase, r)}
										</option>
									))}
								</select>
								<Button
									variant="default"
									onClick={() => fetchAllMatchs()}
									disabled={!round || loadingId === round}
									loading={loadingId === round}
								>
									Fetch all matches
								</Button>
							</div>
							{round && (
								<div className="flex flex-wrap gap-2">
									{Array.from({ length: Math.floor(tournament.registered_user_count / FETCH_ALL_ASYNC.perPage) }).map((_, page) => (
										<Button
											key={page}
											variant="outline"
											size="sm"
											onClick={() => handleRunRound(page + 1, FETCH_ALL_ASYNC.perPage)}
										>
											matchs {page * FETCH_ALL_ASYNC.perPage + 1}–{(page + 1) * FETCH_ALL_ASYNC.perPage}
										</Button>
									))}
								</div>
							)}
						</>
					)}
				</div>
			))}

			{message && (
				<Alert severity={loadingId ? 'info' : message.startsWith('✅') ? 'success' : 'error'}>
					{message}
				</Alert>
			)}
		</div>
	);
}
