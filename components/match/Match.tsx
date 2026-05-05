import { useFetch } from '@/src/hooks/useFetch';
import { getStatusFromMatch, showScoreFromMatch } from '@/src/domain/rules/matchRules';
import type { Match as MatchType } from '@/src/types/match';

interface MatchProps {
	id: string;
	tournamentId: string;
	roundId: string;
}

const Match = ({ id, tournamentId, roundId }: MatchProps) => {
	const { data, loading, error } = useFetch(`/api/rounds/${roundId}/matchs/${id}`);
	const match = data as MatchType | null;
	if (loading) return <div>Chargement...</div>;
	if (error) return <div>Erreur : {error}</div>;
	if (!match) return <div>Match introuvable.</div>;
	return (
		<div>
			<h2>Match {id}</h2>
			<p>Tournament ID : {tournamentId}</p>
			<p>Round ID : {roundId}</p>
			<p>Joueur 1 : {match.player_match_relationships[0].player.best_identifier}</p>
			<p>Joueur 2 : {match.player_match_relationships[1].player.best_identifier}</p>
			<p>Score : {showScoreFromMatch(match)}</p>
			<p>Statut : {getStatusFromMatch(match).label}</p>
		</div>
	);
};

export default Match;
