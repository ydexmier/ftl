// pages/round.js
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import { Grid, Box, CircularProgress, Pagination, Stack } from '@mui/material';

import MatchCard from '@components/scooting/MatchCard';
import MatchModal from '@components/scooting/MatchModal';
import RoundHeader from '@components/scooting/RoundHeader';
import RoundSearch from '@components/scooting/RoundSearch';
import { useRound } from '@components/hooks/useRound';

const Round = ({ roundId, page: initialPage, perPage: initialPerPage, search: initialSearch }) => {
	const [page, setPage] = useState(parseInt(initialPage, 10) || 1);
	const [perPage, setPerPage] = useState(parseInt(initialPerPage, 10) || 10);
	const [search, setSearch] = useState(initialSearch || '');
	const router = useRouter();
	const { tournamentId } = router.query;
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
		pagination,
	} = useRound(roundId, tournamentId, { page, perPage, search: initialSearch });

	/* Pagination */
	const paginationComponent = useMemo(
		() => (
			<Stack direction="row" justifyContent="center" sx={{ mt: 2, mb: 2 }}>
				<Pagination
					count={pagination.totalPages || 1}
					page={page}
					onChange={(_, value) => setPage(value)}
					color="primary"
					showFirstButton
					showLastButton
				/>
			</Stack>
		),
		[pagination],
	);

	// 🔗 Sync état -> URL
	useEffect(() => {
		if (!roundId) return;

		const query = {
			tournamentId,
			roundId,
			page,
			perPage,
			...(search ? { search } : {}),
		};

		router.replace(
			{
				pathname: router.pathname,
				query,
			},
			undefined,
			{ shallow: true },
		);
	}, [roundId, page, perPage, search]);
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

			{!matchs.length ? (
				loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
						<CircularProgress />
					</Box>
				) : (
					<Box>La round n'est pas encore lancé ou n'a pas été MAJ</Box>
				)
			) : (
				<>
					{paginationComponent}
					<Grid
						wrap="wrap"
						container
						spacing={2}
						sx={{ justifyContent: 'flex-start', alignItems: 'stretch' }}
					>
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
											match.player_match_relationships.find((p) => p.player_order === 2).player
												.id,
										)
									}
									match={match}
								/>
							</Grid>
						))}
					</Grid>
					{paginationComponent}
				</>
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
