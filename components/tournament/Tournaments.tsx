'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Spinner } from '@components/ui/Spinner';
import { Alert } from '@components/ui/Alert';
import TournamentCard from '@components/tournament/TournamentCard';
import FetchTournamentForm from '@components/tournament/FetchTournamentForm';
import type { Tournament } from '@/src/types/tournament';

const Tournaments = () => {
	const router = useRouter();
	const [tournaments, setTournaments] = useState<Tournament[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchTournaments = async () => {
			setLoading(true);
			setError(null);
			try {
				const response = await fetch('/api/tournaments');
				if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
				const data: Tournament[] = await response.json();
				setTournaments(
					data.sort(
						(a, b) =>
							new Date(b.start_datetime ?? 0).getTime() -
							new Date(a.start_datetime ?? 0).getTime(),
					),
				);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error');
			} finally {
				setLoading(false);
			}
		};
		fetchTournaments();
	}, []);

	if (loading) {
		return (
			<div className="flex justify-center items-center py-20">
				<Spinner size="lg" />
			</div>
		);
	}

	if (error) {
		return <Alert severity="error">{error}</Alert>;
	}

	return (
		<div className="mt-6 flex flex-col gap-6">
			<FetchTournamentForm
				onSubmitCallback={(data) => router.push(`/tournaments/${data.id}`)}
			/>
			<h2 className="text-lg font-semibold text-foreground">Liste des tournois</h2>
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
				{tournaments.map((t) => (
					<Link key={t.id} href={`/tournaments/${t.id}`} className="block">
						<TournamentCard tournament={t} />
					</Link>
				))}
			</div>
		</div>
	);
};

export default Tournaments;
