import { useFetch } from '@/src/hooks/useFetch';

import { getStatusFromMatch, showScoreFromMatch } from '@/src/domain/rules/matchRules';

const Match = (props) => {
	const { id, tournamentId, roundId } = props; // récupère l'id de l'URL
	const { data: match, loading, error } = useFetch(`/api/rounds/${roundId}/matchs/${id}`);
	if (loading) return <div>Loading match...</div>;
	if (error) return <div>Error: {error}</div>;
	if (!match) return <div>No match found.</div>;
	return (
		<div>
			<h2>Match {id}</h2>
			<p>Tournament ID: {tournamentId}</p>
			<p>Round ID: {roundId}</p>
			<p>Player 1: {match.player_match_relationships[0].player.best_identifier}</p>
			<p>Player 2: {match.player_match_relationships[1].player.best_identifier}</p>
			<p>Score: {showScoreFromMatch(match)}</p>
			<p>Status: {getStatusFromMatch(match).label}</p>
		</div>
	);
};
export default Match;
