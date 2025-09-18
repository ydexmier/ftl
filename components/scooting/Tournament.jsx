// ftl/components/scooting/components/Tournament.jsx
import { useState } from 'react';
import { useRouter } from 'next/router';

import { FormControl, Select, MenuItem, Box, Grid } from '@mui/material';

import { getRoundName } from '@components/scooting/utils/roundToString';

import Round from '@components/scooting/Round';
import { useTournament } from '@components/hooks/useTournament';
import FetchButton from '@components/FetchButton';

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

	const { tournament, loading, error, refreshTournament } = useTournament(id);
	const { updatedAt } = tournament || {};
	const handlePhaseChange = (event) => {
		const selectedRoundId = event.target.value;
		if (!selectedRoundId) return; // ignore placeholder
		setRoundId(selectedRoundId);
	};

	if (loading) return <div>Loading tournament...</div>;
	if (error) return <div>Error loading tournament: {error.message}</div>;
	if (!tournament) return <div>No tournament data available.</div>;

	return (
		<div>
			<h1>Tournoi: {tournament.name}</h1>

			<Grid container spacing={2} justifyContent="space-between">
				<p>
					Nombre de joueur restant: {tournament.registered_user_count}/{tournament.capacity}
				</p>

				<Box container>
					<FetchButton
						defaultLabel="MAJ Tournoi"
						onFetch={refreshTournament}
						refreshDelay={60}
						lastUpdate={updatedAt}
					/>
				</Box>
			</Grid>

			<FormControl fullWidth>
				<Select
					labelId="phases-label"
					id="phases"
					value={roundId} // valeur sélectionnée
					onChange={handlePhaseChange}
					displayEmpty
				>
					<MenuItem value="">-- sélectionnée une round --</MenuItem>
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
		</div>
	);
}
