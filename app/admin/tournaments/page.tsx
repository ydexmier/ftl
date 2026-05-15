'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@components/ui/Alert';
import { Spinner } from '@components/ui/Spinner';
import TournamentsGrid from '@components/admin/TournamentsGrid';
import FetchTournamentForm from '@components/tournament/FetchTournamentForm';
import type { Tournament } from '@/src/types/tournament';

export default function TournamentsPage() {
	const router = useRouter();
	const [tournaments, setTournaments] = useState<Tournament[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const fetchTournaments = async () => {
		setLoading(true);
		setError('');
		try {
			const res = await fetch('/api/tournaments');
			if (!res.ok) throw new Error('Erreur lors de la récupération des tournois');
			const data = await res.json();
			setTournaments(data || []);
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTournaments();
	}, []);

	return (
		<div className="max-w-5xl mx-auto flex flex-col gap-6">
			<h1 className="text-2xl font-bold text-foreground">Tournois</h1>

			<div className="bg-card border border-border rounded-xl p-6">
				<h2 className="text-base font-semibold text-foreground mb-3">Récupérer un tournoi</h2>
				<FetchTournamentForm
					onValidate={(id: number) => !tournaments.some((t) => t.id === id)}
					onSubmitCallback={(data: { id: number }) => router.push(`/admin/tournaments/${data.id}`)}
				/>
			</div>

			<div className="bg-card border border-border rounded-xl p-6">
				<h2 className="text-base font-semibold text-foreground mb-4">Tournois stockés</h2>
				{loading && (
					<div className="flex justify-center py-6">
						<Spinner size="md" />
					</div>
				)}
				{error && <Alert severity="error">{error}</Alert>}
				{!loading && tournaments.length === 0 && (
					<p className="text-sm text-muted-foreground">Aucun tournoi trouvé</p>
				)}
				<TournamentsGrid tournaments={tournaments} />
			</div>
		</div>
	);
}
