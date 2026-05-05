'use client';

import { Grid, Link } from '@mui/material';
import TournamentCard from '@components/tournament/TournamentCard';

export default function TournamentGrid({ tournaments }) {
	return (
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
					<Link underline="none" href={`/admin/tournaments/${t.id}`}>
						<TournamentCard tournament={t} />
					</Link>
				</Grid>
			))}
		</Grid>
	);
}
