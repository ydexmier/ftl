// pages/round.js
import { Grid, Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import MatchCard from '@scooting/components/MatchCard';
import MatchModal from '@scooting/components/MatchModal';
import RoundHeader from '@scooting/components/RoundHeader';
import RoundSearch from '@scooting/components/RoundSearch';
import { useRound } from '@scooting/hooks/useRound';

const Round = ({ roundId }) => {
	const { tournamentId } = useRouter().query;
	const {
		matchs,
		updatedAt,
		loading,
		error,
		matchToShow,
		openMatchModal,
		closeMatchModal,
		onValidateAssignDeck,
		getPlayerDecksInk,
		getMatchPlayerInks,
		refreshRound,
		search,
		setSearch,
	} = useRound(roundId, tournamentId);

	return (
		<>
			{/* Toujours visible */}
			<RoundHeader updatedAt={updatedAt} onRefresh={refreshRound} />

			<Grid container spacing={2} sx={{ mb: 2 }}>
				<Grid item xs={12} sm={6} md={4} size={{ xs: 12, sm: 6, md: 4 }}>
					<RoundSearch value={search} onChange={setSearch} />
				</Grid>
			</Grid>

			{/* Zone de contenu */}
			{error && error !== 'ROUND_NOT_FOUND' && <Box sx={{ mt: 2 }}>Error: {error}</Box>}

			{loading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
					<CircularProgress />
				</Box>
			) : !matchs.length ? (
				<Box>La round n'est pas encore lancé ou n'a pas été MAJ</Box>
			) : (
				<Grid wrap="wrap" container spacing={2} sx={{ justifyContent: 'flex-start', alignItems: 'stretch' }}>
					{matchs.map((match) => (
						<Grid
							sx={{ display: 'flex' }}
							xs={12}
							sm={6}
							md={4}
							item
							onClick={openMatchModal(match)}
							key={match.id}
							size={{ xs: 12, sm: 6, md: 4 }}
						>
							<MatchCard
								sx={{
									minWidth: '100%',
									display: 'flex',
									flexDirection: 'column',
									cursor: 'pointer',
									'&:hover': { boxShadow: 6 },
								}}
								player1Deck={getPlayerDecksInk(
									match.player_match_relationships.find(
										(p) => p.player_order === 1 || match.match_is_bye,
									).player.id,
								)}
								player2Deck={
									!match.match_is_bye &&
									getPlayerDecksInk(
										match.player_match_relationships.find((p) => p.player_order === 2).player.id,
									)
								}
								match={match}
							/>
						</Grid>
					))}
				</Grid>
			)}

			<MatchModal
				match={matchToShow}
				open={!!matchToShow}
				combinationsInitial={matchToShow && getMatchPlayerInks(matchToShow)}
				onValidate={onValidateAssignDeck}
				onClose={closeMatchModal}
			/>
		</>
	);
};

export default Round;
