import { useRouter } from 'next/router';
import Layout from '@components/Layout';
import MatchComponent from '@components/scooting/Match';

export default function MatchPage() {
	const router = useRouter();
	const { tournamentId, roundId, matchId } = router.query; // récupère l'id de l'URL
	if (!tournamentId) return <div>Loading...</div>;
	return (
		<Layout>
			<MatchComponent id={matchId} tournamentId={tournamentId} roundId={roundId} />
		</Layout>
	);
}
