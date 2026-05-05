'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { Spinner } from '@components/ui/Spinner';
import TournamentsGrid from '@components/admin/TournamentsGrid';
import FetchTournamentForm from '@components/tournament/FetchTournamentForm';
import type { Tournament } from '@/src/types/tournament';

export default function DashboardPage() {
	const router = useRouter();
	const [tournaments, setTournaments] = useState<Tournament[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleLogout = () => {
		Cookies.remove('adminAuth');
		router.push('/admin/login');
	};

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
			<div className="bg-card border border-border rounded-xl p-6">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
					<Button variant="destructive" onClick={handleLogout}>
						Déconnexion
					</Button>
				</div>

				<div className="bg-background border border-border rounded-lg p-4 mb-4">
					<h2 className="text-base font-semibold text-foreground mb-3">Récupérer un tournoi</h2>
					<FetchTournamentForm
						onValidate={(id: number) => !tournaments.some((t) => t.id === id)}
						onSubmitCallback={(data: { id: number }) => router.push(`/admin/tournaments/${data.id}`)}
					/>
				</div>

				<div className="bg-background border border-border rounded-lg p-4">
					<h2 className="text-base font-semibold text-foreground mb-3">Tournois stockés</h2>
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
		</div>
	);
}
