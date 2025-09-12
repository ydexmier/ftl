// pages/tournaments/[id].jsx
import { useRouter } from 'next/router';
import Layout from '@components/Layout';
import TournamentComponent from '@components/scooting/Tournament';

export default function TournamentPage() {
	const router = useRouter();
	const { tournamentId } = router.query; // récupère l'id de l'URL
	if (!tournamentId) return <div>Loading...</div>;
	return (
		<Layout>
			<TournamentComponent id={tournamentId} />
		</Layout>
	);
}
