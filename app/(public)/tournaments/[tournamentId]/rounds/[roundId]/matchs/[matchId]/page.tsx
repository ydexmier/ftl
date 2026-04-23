'use client';
import { useParams } from 'next/navigation';
import MatchComponent from '@components/scooting/Match';

export default function MatchPage() {
	const { tournamentId, roundId, matchId } = useParams<{
		tournamentId: string;
		roundId: string;
		matchId: string;
	}>();
	if (!tournamentId) return <div>Loading...</div>;
	return <MatchComponent id={matchId} tournamentId={tournamentId} roundId={roundId} />;
}
