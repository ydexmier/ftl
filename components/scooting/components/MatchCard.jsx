import React from 'react';
import { Card, CardContent, Typography, Chip, Grid } from '@mui/material';
import Ink from '@components/Ink';
import { getStatusFromMatch, showScoreFromMatch } from '@scooting/utils/match';

const MatchCard = ({ match, player1Deck, player2Deck, ...props }) => {
	const status = getStatusFromMatch(match);
	const [player1, player2] = [
		match.player_match_relationships.find((p) => p.player_order === 1 || match.match_is_bye),
		player2Deck && match.player_match_relationships.find((p) => p.player_order === 2),
	];

	return (
		<Card {...props} variant="outlined">
			<CardContent>
				<Grid
					container
					direction="row"
					sx={{
						justifyContent: 'space-between',
						alignItems: 'stretch',
					}}
				>
					<Chip label={`Table ${match.table_number}`} />
					<Chip size="small" color={status.color} label={status.label} />
				</Grid>
				<Grid container spacing={1} sx={{ my: 2, justifyContent: 'space-between', alignItems: 'center' }}>
					<Typography variant="h6">{player1.player.best_identifier}</Typography>
					<Typography color="textSecondary">{showScoreFromMatch(match)}</Typography>
					<Typography variant="h6">{player2 ? player2.player.best_identifier : 'BYE'}</Typography>
				</Grid>
				<Grid container spacing={1} sx={{ my: 2, justifyContent: 'space-between', alignItems: 'center' }}>
					<Grid item>
						{player1Deck?.map((deck) => (
							<Grid key={player1.player.id + '_' + deck.inks.join('-')} direction="row" container>
								{deck.inks.map((ink) => (
									<Ink key={player1.player.id + '_' + ink} type={ink} width={40} />
								))}
							</Grid>
						))}
					</Grid>
					{player2 && <Grid item>
						{player2Deck?.map((deck) => (
							<Grid key={player1.player.id + '_' + deck.inks.join('-')} direction="row" container>
								{deck.inks.map((ink) => (
									<Ink key={player2.player.id + '_' + ink} type={ink} width={40} />
								))}
							</Grid>
						))}
					</Grid>}
				</Grid>
			</CardContent>
		</Card>
	);
};

export default MatchCard;
