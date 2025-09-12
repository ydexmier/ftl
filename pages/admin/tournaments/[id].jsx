// pages/admin/tournament/[id].jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
	Container,
	Paper,
	Typography,
	Card,
	CardMedia,
	CardContent,
	Grid,
	Box,
	Button,
	Alert,
	Tabs,
	Tab,
} from '@mui/material';
import FetchRoundForm from '@components/admin/FetchRoundForm';
import DeleteTournamentButton from '@components/scooting/DeleteTournamentButton';

export default function TournamentPage() {
	const router = useRouter();
	const { id } = router.query; // ✅ récupération de l'id depuis l'URL

	const [tournament, setTournament] = useState(null);
	const [loading, setLoading] = useState(true);
	const [message, setMessage] = useState('');
	const [tabIndex, setTabIndex] = useState(0);

	useEffect(() => {
		if (!id) return;
		const fetchTournament = async () => {
			try {
				const res = await fetch(`/api/tournaments/${id}`);
				if (!res.ok) throw new Error('Impossible de récupérer le tournoi');
				const data = await res.json();
				setTournament(data);
			} catch (err) {
				setMessage(err.message);
			} finally {
				setLoading(false);
			}
		};
		fetchTournament();
	}, [id]);

	if (!id) return <Typography>Chargement des paramètres...</Typography>;
	if (loading) return <Typography>Chargement...</Typography>;
	if (!tournament) {
		return <Alert severity="error">{message || 'Tournoi introuvable'}</Alert>;
	}

	return (
		<Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
			{/* ✅ Bouton retour */}
			<Box mb={2}>
				<Button variant="outlined" color="primary" onClick={() => router.push('/admin/dashboard')}>
					← Retour au Dashboard
				</Button>
			</Box>

			<Typography variant="h4" gutterBottom>
				{tournament.name}
				<DeleteTournamentButton
					tournamentId={tournament.id}
					onDeleted={() => router.push('/admin/dashboard')}
				/>
			</Typography>

			<Paper sx={{ p: 4 }}>
				{/* Onglets */}
				<Tabs value={tabIndex} onChange={(e, newValue) => setTabIndex(newValue)} sx={{ mb: 3 }}>
					<Tab label="Détails" />
					<Tab label="Script Round" />
				</Tabs>

				{/* Onglet Détails */}
				{tabIndex === 0 && (
					<Box>
						<Card sx={{ mb: 3 }}>
							{tournament.full_header_image_url && (
								<CardMedia
									component="img"
									height="200"
									image={tournament.full_header_image_url}
									alt={tournament.name}
								/>
							)}
							<CardContent>
								<Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
									{tournament.description}
								</Typography>
							</CardContent>
						</Card>

						<Grid container spacing={2} sx={{ mb: 3 }}>
							<Grid item xs={12} sm={6}>
								<Typography variant="subtitle1">
									📍 {tournament.store?.name || 'Lieu inconnu'}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{tournament.full_address}
								</Typography>
							</Grid>
							<Grid item xs={12} sm={6}>
								<Typography variant="subtitle1">
									👥 {tournament.registered_user_count} joueurs
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{tournament.start_datetime
										? new Date(tournament.start_datetime).toLocaleString()
										: 'Date inconnue'}
								</Typography>
							</Grid>
						</Grid>
					</Box>
				)}
				{/* Onglet Script Round */}
				{tabIndex === 1 && (
					<Box>
						<Typography variant="h6" gutterBottom>
							Lancer un script pour un round
						</Typography>
						{<FetchRoundForm tournamentId={tournament.id} phases={tournament.tournament_phases || []} />}
					</Box>
				)}
			</Paper>
		</Container>
	);
}
