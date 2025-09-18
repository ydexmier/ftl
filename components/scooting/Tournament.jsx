// ftl/components/scooting/components/Tournament.jsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import { FormControl, Select, MenuItem, Box, Typography, Divider } from '@mui/material';

import { getRoundName } from '@components/scooting/utils/roundToString';

import Round from '@components/scooting/Round';
import { useFetch } from '@components/hooks/useFetch';
import FetchButton from '@components/FetchButton';

import { fetchTournament } from 'lib/api/fetchTournament';

export default function Tournament(props) {
	const { id } = props; // récupère l'id de l'URL
	const router = useRouter();
	// ⚡ On lit roundId, page, perPage depuis l'URL
	const {
		roundId: queryRoundId,
		page: queryPage = 1,
		perPage: queryPerPage = 10,
		search: querySearch = '',
	} = router.query;

	const [roundId, setRoundId] = useState(queryRoundId || '');

	const [tournament, setTournament] = useState(null);
	const { data, loading, error } = useFetch(`/api/tournaments/${id}`);

	const handlePhaseChange = (event) => {
		const selectedRoundId = event.target.value;
		if (!selectedRoundId) return; // ignore placeholder
		setRoundId(selectedRoundId);
	};

	useEffect(() => {
		setTournament(data);
	}, [data]);

	if (loading) return <div>Loading tournament...</div>;
	if (error) return <div>Error loading tournament: {error.message}</div>;
	if (!tournament) return <div>No tournament data available.</div>;

	return (
		<div>
			<h1>Tournoi: {tournament.name}</h1>
			<p>
				Nombre de joueur: {tournament.registered_user_count}/{tournament.capacity}
			</p>
			<FormControl fullWidth>
				<Select
					labelId="phases-label"
					id="phases"
					value={roundId} // valeur sélectionnée
					onChange={handlePhaseChange}
					displayEmpty
				>
					<MenuItem value="">-- Please choose a phase --</MenuItem>
					{tournament.tournament_phases.map((phase) =>
						phase.rounds.map((round) => (
							<MenuItem key={round.id} value={round.id}>
								{getRoundName(phase, round)}
							</MenuItem>
						)),
					)}
				</Select>
			</FormControl>
			{roundId && <Round roundId={roundId} page={queryPage} perPage={queryPerPage} search={querySearch} />}
			{tournament.settings.event_lifecycle_status === 'REGISTRATION_OPEN' && (
				<>
					<Divider sx={{ mt: 4 }} />
					<Box container sx={{ mt: 4 }}>
						<Typography sx={{ mb: 2 }}>Veuillez MAJ le tournoi une fois qu'il sera démarré</Typography>
						<FetchButton
							defaultLabel="MAJ Tournoi"
							onFetch={async () => {
								// ton fetch API
								const res = await fetchTournament(id, true);
								setTournament(res.datas);
							}}
							refreshDelay={60}
							lastUpdate={tournament.updatedAt}
						/>
					</Box>
				</>
			)}
		</div>
	);
}
