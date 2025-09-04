// ftl/components/scooting/components/Tournament.jsx
import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { getRoundName } from '../utils/roundToString';
import Round from './Round';

export default function Tournament(props) {
	const { id } = props; // récupère l'id de l'URL
	const [roundId, setRoundId] = useState(null);
	const { data: tournament, loading, error } = useFetch(`/api/tournaments/${id}`);

	const handlePhaseChange = (event) => {
		const selectedRoundId = event.target.value;
		setRoundId(selectedRoundId);
	};
	if (loading) return <div>Loading tournament...</div>;
	if (error) return <div>Error loading tournament: {error.message}</div>;
	if (!tournament) return <div>No tournament data available.</div>;
	return (
		<div>
			<h1>Tournament {id}</h1>
			<p>Nombre de joueur: {tournament.registered_user_count}</p>
			<select onChange={handlePhaseChange} name="phases" id="phases">
				<option value="">--Please choose a phase--</option>
				{tournament.tournament_phases.map((phase) =>
					phase.rounds.map((round) => (
						<option key={round.id} value={round.id}>
							{getRoundName(phase, round)}
						</option>
					)),
				)}
			</select>
			{roundId && <Round roundId={roundId} />}
		</div>
	);
}
