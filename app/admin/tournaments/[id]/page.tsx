'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/src/lib/api/apiFetch';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@components/ui/Button';
import { Alert } from '@components/ui/Alert';
import { Spinner } from '@components/ui/Spinner';
import Tabs from '@components/ui/Tabs';
import FetchRoundForm from '@components/admin/FetchRoundForm';
import DeleteTournamentButton from '@components/tournament/DeleteTournamentButton';
import type { Tournament } from '@/src/types/tournament';

export default function TournamentPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();

	const [tournament, setTournament] = useState<Tournament | null>(null);
	const [loading, setLoading] = useState(true);
	const [message, setMessage] = useState('');

	useEffect(() => {
		if (!id) return;
		const fetchTournament = async () => {
			try {
				const res = await apiFetch(`/api/tournaments/${id}`);
				const data = await res.json();
				setTournament(data);
			} catch (err) {
				setMessage((err as Error).message);
			} finally {
				setLoading(false);
			}
		};
		fetchTournament();
	}, [id]);

	if (!id) return <p className="text-muted-foreground text-sm">Chargement des paramètres...</p>;
	if (loading) return (
		<div className="flex justify-center mt-8">
			<Spinner size="lg" />
		</div>
	);
	if (!tournament) return <Alert severity="error">{message || 'Tournoi introuvable'}</Alert>;

	return (
		<div className="max-w-3xl mx-auto flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<Button variant="outline" size="sm" onClick={() => router.push('/admin/dashboard')}>
					← Retour
				</Button>
				<h1 className="text-xl font-bold text-foreground flex-1">{tournament.name}</h1>
				<DeleteTournamentButton
					tournamentId={tournament.id}
					onDeleted={() => router.push('/admin/dashboard')}
				/>
			</div>

			<div className="bg-card border border-border rounded-xl overflow-hidden">
				<Tabs
					tabs={[
						{
							label: 'Détails',
							component: (
								<div className="flex flex-col gap-4">
									{tournament.full_header_image_url && (
										<img
											src={tournament.full_header_image_url}
											alt={tournament.name}
											className="w-full h-48 object-cover rounded-lg"
										/>
									)}
									{tournament.description && (
										<p className="text-sm text-foreground whitespace-pre-line">
											{tournament.description}
										</p>
									)}
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div>
											<p className="text-sm font-medium text-foreground">
												📍 {tournament.store?.name || 'Lieu inconnu'}
											</p>
											<p className="text-xs text-muted-foreground">{tournament.full_address}</p>
										</div>
										<div>
											<p className="text-sm font-medium text-foreground">
												👥 {tournament.registered_user_count} joueurs
											</p>
											<p className="text-xs text-muted-foreground">
												{tournament.start_datetime
													? new Date(tournament.start_datetime).toLocaleString()
													: 'Date inconnue'}
											</p>
										</div>
									</div>
								</div>
							),
						},
						{
							label: 'Script Round',
							component: (
								<div className="flex flex-col gap-3">
									<h2 className="text-sm font-semibold text-foreground">Lancer un script pour un round</h2>
									<FetchRoundForm tournament={tournament} phases={tournament.tournament_phases || []} />
								</div>
							),
						},
					]}
				/>
			</div>
		</div>
	);
}
