'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Box, Button, Container, Typography, Paper, Alert } from '@mui/material';
import TournamentGrid from '@components/admin/TournamentsGrid';
import FetchTournamentForm from '@components/FetchTournamentForm';

export default function DashboardPage() {
	const router = useRouter();
	const [tournaments, setTournaments] = useState([]);
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
		<Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
			<Paper sx={{ p: 4, mb: 4 }}>
				<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
					<Typography variant="h4">Admin Dashboard</Typography>
					<Button variant="contained" color="error" onClick={handleLogout}>
						Déconnexion
					</Button>
				</Box>

				<Paper sx={{ p: 3, mb: 4 }} elevation={2}>
					<Typography variant="h6" gutterBottom>
						Récupérer un tournoi
					</Typography>
					<FetchTournamentForm
						onValidate={(id: number) => !tournaments.some((t: { id: number }) => t.id === id)}
						onSubmitCallback={(data: { id: number }) => router.push(`/admin/tournaments/${data.id}`)}
					/>
				</Paper>

				<Paper sx={{ p: 3 }} elevation={2}>
					<Typography variant="h6" gutterBottom>
						Tournois stockés
					</Typography>
					{loading && <Typography>Chargement...</Typography>}
					{error && <Alert severity="error">{error}</Alert>}
					{!loading && tournaments.length === 0 && <Typography>Aucun tournoi trouvé</Typography>}
					<TournamentGrid tournaments={tournaments} />
				</Paper>
			</Paper>
		</Container>
	);
}
