'use client';
import { useParams } from 'next/navigation';
import TournamentComponent from '@components/tournament/Tournament';

export default function TournamentPage() {
	const { tournamentId } = useParams<{ tournamentId: string }>();
	if (!tournamentId) return <div>Loading...</div>;
	return <TournamentComponent id={tournamentId} />;
}
