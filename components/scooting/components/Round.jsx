import React, { useState } from 'react';
import { Grid, Box } from '@mui/material';
import { useRouter } from 'next/router';

import { useFetch } from '@scooting/hooks/useFetch';
import MatchCard from '@scooting/components/MatchCard';
import MatchModal from '@scooting/components/MatchModal';
import FetchButton from '@components/FetchButton';
import { fetchRound } from '@scooting/lib/api/fetchRound';
import { diffInSeconds } from '../utils/date';
const Round = (props) => {
	const [matchToShow, setMatchToShow] = useState(null);
	const router = useRouter();
	const { tournamentId } = router.query;
	const { roundId } = props;
	const { data: round, loading, error, setData } = useFetch(`/api/rounds/${roundId}/matchs`);
	const { results: matchs = [], updatedAt, playersDecks = { players: [] } } = round || {};

	const closeMatchModal = () => setMatchToShow(null);
	const openMatchModal = (match) => () => setMatchToShow(match);
	const onValidateAssignDeck = (datas) => {
		console.log('onValidateAssignDeck', datas);
		// Here you can call an API to save the assigned deck to the match
		fetch(`/api/rounds/${roundId}/matchs/${matchToShow.id}/assign_deck`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				decks: [datas.combination1, datas.combination2],
			}),
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then((data) => {
				// Close the modal after successful assignment
				setData({
					...round,
					playersDecks: {
						...playersDecks,
						players: data.playersDecks.players || [],
					},
				}); // mettre à jour playersDecks si nécessaire
				closeMatchModal();
			})
			.catch((error) => {
				console.error('Error:', error);
				// You might want to show an error message to the user here
			});
		setMatchToShow(null);
	};
	const getPlayerDecksInk = (playerId) => {
		const player = playersDecks.players.find((p) => p.playerId === playerId);

		return player ? player.decks || [] : [];
	};
	const getMatchPlayerInks = (match) => {
		const matchPlayerInks = match.player_match_relationships.reduce((acc, pmr) => {
			const hasPlayerCombinations = playersDecks.players.find((p) => p.playerId === pmr.player.id);
			if (!hasPlayerCombinations) return acc;
			acc.push(hasPlayerCombinations);
			return acc;
		}, []);

		return matchPlayerInks.length ? matchPlayerInks : undefined;
	};
	const renderFetchButton = () => (
		<FetchButton
			defaultLabel="MAJ Round"
			onFetch={async () => {
				// ton fetch API
				const res = await fetchRound(tournamentId, roundId);
				setData(res.datas);
			}}
			refreshDelay={60}
			initialCooldown={diffInSeconds(new Date(updatedAt), new Date())}
		/>
	);

	if (loading) return <Box sx={{ mt: 2 }}>Loading matchs...</Box>;
	if (error && error !== 'ROUND_NOT_FOUND') return <Box sx={{ mt: 2 }}>Error: {error}</Box>;
	if (!matchs || matchs.length === 0)
		return (
			<Grid container spacing={1} sx={{ my: 2, justifyContent: 'space-between', alignItems: 'center' }}>
				La round n'est pas encore lancé ou n'a pas été MAJ
				{renderFetchButton()}
			</Grid>
		);
	return (
		<>
			<div>
				<Grid container spacing={1} sx={{ my: 2, justifyContent: 'space-between', alignItems: 'center' }}>
					<h2>Matchs</h2>
					{renderFetchButton()}
				</Grid>

				{matchs.length > 0 && (
					<Grid
						wrap="wrap"
						container
						spacing={2}
						sx={{
							justifyContent: 'flex-start',
							alignItems: 'stretch',
						}}
					>
						{matchs.map((match) => (
							<Grid
								sx={{ display: 'flex' }}
								xs={12} // mobile : 1 card par row
								sm={6} // tablette : 2 cards par row
								md={4} // desktop : 3 cards par row
								item
								onClick={openMatchModal(match)}
								key={match.id}
								size={{ xs: 12, sm: 6, md: 4 }}
							>
								<MatchCard
									sx={{
										minWidth: '100%', // ✅ prend toute la largeur du Grid item
										display: 'flex',
										flexDirection: 'column',
										cursor: 'pointer',
										'&:hover': {
											boxShadow: 6, // effet hover
										},
									}}
									player1Deck={getPlayerDecksInk(
										match.player_match_relationships.find(
											(p) => p.player_order === 1 || match.match_is_bye,
										).player.id,
									)}
									player2Deck={
										!match.match_is_bye &&
										getPlayerDecksInk(
											match.player_match_relationships.find((p) => p.player_order === 2).player
												.id,
										)
									}
									match={match}
								/>
							</Grid>
						))}
					</Grid>
				)}
			</div>
			<MatchModal
				match={matchToShow}
				open={!!matchToShow}
				combinationsInitial={matchToShow && getMatchPlayerInks(matchToShow)}
				onValidate={onValidateAssignDeck}
				onClose={closeMatchModal}
				aria-labelledby="match-modal-title"
				aria-describedby="match-modal-description"
			/>
		</>
	);
};

export default Round;
