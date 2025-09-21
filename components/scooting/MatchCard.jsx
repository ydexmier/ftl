import { Card, CardContent, Typography, Chip, Grid, Box, Divider } from '@mui/material';

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
				<Divider sx={{ my: 2 }} />
				<Grid container spacing={1}>
					<Grid size={6}>
						<Typography variant="h6">{player1.player.best_identifier}</Typography>
					</Grid>
					<Grid size={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
						<Chip variant="outlined" label={player1.user_event_status.best_identifier} />
					</Grid>

					<Grid container spacing={1} size={12} sx={{ justifyContent: 'center' }}>
						<Box
							sx={{
								display: 'flex',
								gap: 2, // espace entre les decks
								flexWrap: 'wrap', // permet de passer à la ligne si la largeur est trop petite
							}}
						>
							{player1Deck?.map((deck, deckIndex) => (
								<Box
									key={player1.player.id + '_' + deckIndex}
									sx={{
										display: 'flex', // pour que les Ink soient côte à côte
									}}
								>
									{deck.map((ink) => (
										<Ink key={player1.player.id + '_' + ink} type={ink} width={40} />
									))}
								</Box>
							))}
						</Box>
					</Grid>
				</Grid>

				<Divider sx={{ my: 1 }} textAlign="center">
					<Typography color="textPrimary">
						{player2 ? (
							showScoreFromMatch(match)
						) : (
							<Typography variant="h6" color="textSecondary">
								BYE
							</Typography>
						)}
					</Typography>
				</Divider>
				{player2 ? (
					<Grid container spacing={1}>
						<Grid size={6}>
							<Typography variant="h6">{player2.player.best_identifier}</Typography>
						</Grid>
						<Grid size={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
							<Chip variant="outlined" label={player2.user_event_status.best_identifier} />
						</Grid>

						<Grid container spacing={1} size={12} sx={{ justifyContent: 'center' }}>
							<Box
								sx={{
									display: 'flex',
									gap: 2, // espace entre les decks
									flexWrap: 'wrap', // permet de passer à la ligne si la largeur est trop petite
								}}
							>
								{player2Deck?.map((deck, deckIndex) => (
									<Box
										key={player2.player.id + '_' + deckIndex}
										sx={{
											display: 'flex', // pour que les Ink soient côte à côte
										}}
									>
										{deck.map((ink) => (
											<Ink key={player2.player.id + '_' + ink} type={ink} width={40} />
										))}
									</Box>
								))}
							</Box>
						</Grid>
					</Grid>
				) : (
					''
				)}
			</CardContent>
		</Card>
	);
};

export default MatchCard;
