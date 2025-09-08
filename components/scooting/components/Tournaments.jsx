import React, { useEffect, useState } from 'react';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import TournamentCard from '@components/TournamentCard';

const Tournaments = () => {
	const [tournaments, setTournaments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchTournaments = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await fetch('/api/tournaments');
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const data = await response.json();
				setTournaments(data);
			} catch (err) {
				setError(err.message || 'Unknown error');
			} finally {
				setLoading(false);
			}
		};

		fetchTournaments();
	}, []);

	if (loading) return <div>Loading tournaments...</div>;
	if (error) return <div>Error: {error}</div>;
	return (
		<div>
			<h2>Liste des tournois</h2>
			<Grid container spacing={2}>
				{tournaments.map((t) => (
					<Grid
						item
						key={t.id}
						sx={{
							flex: {
								xs: '0 0 100%', // mobile
								sm: '0 0 calc(50% - 8px)', // tablette (spacing/2)
								md: '0 0 calc(33.333% - 16px)', // desktop (spacing * 2)
							},
						}}
					>
						<Link underline="none" href={`/tournaments/${t.id}`}>
							<TournamentCard tournament={t} />
						</Link>
					</Grid>
				))}
			</Grid>
		</div>
	);
};

export default Tournaments;
