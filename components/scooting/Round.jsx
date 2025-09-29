// pages/round.js
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import {
	Grid,
	Box,
	CircularProgress,
	Pagination,
	Stack,
	FormControl,
	Select,
	MenuItem,
	InputLabel,
} from '@mui/material';

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
	} = useRound(roundId, tournamentId, { page, perPage, search, excludeOnePlayerMatches: true });

	/* Pagination */
	const paginationComponent = useMemo(
		() => (
			<Box
				sx={{
					display: 'flex',
					flexDirection: {
						xs: 'column', // en mobile : colonne
					},
					justifyContent: {
						xs: 'center', // mobile : centré
						sm: 'space-between', // desktop : pagination à gauche, select à droite
					},
					alignItems: 'center',
					gap: 2, // espace entre les composants
					mt: 2,
					mb: 2,
				}}
			>
				{/* Select */}
				<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
					<FormControl disabled={pagination.totalPages === 1} size="small" sx={{ minWidth: 120 }}>
						<Select
							value={page}
							onChange={(e) => {
								setPage(Number(e.target.value));
							}}
						>
							{Array.from({ length: pagination.totalPages }, (_, i) => (
								<MenuItem key={i + 1} value={i + 1}>
									Page {i + 1}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<FormControl size="small" sx={{ minWidth: 120 }}>
						<Select
							value={perPage}
							onChange={(e) => {
								setPerPage(Number(e.target.value));
								setPage(1); // reset page quand on change le nombre par page
							}}
						>
							<MenuItem value={10}>10 matchs</MenuItem>
							<MenuItem value={25}>25 matchs</MenuItem>
							<MenuItem value={50}>50 matchs</MenuItem>
							<MenuItem value={100}>100 matchs</MenuItem>
						</Select>
					</FormControl>
				</Box>
				{/* Pagination */}
				<Pagination
					count={pagination.totalPages || 1}
					page={page}
					onChange={(_, value) => setPage(value)}
					color="primary"
					showFirstButton
					showLastButton
				/>
			</Box>
		),
		[pagination, page, perPage],
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
			<RoundHeader updatedAt={updatedAt} onRefresh={refreshRound} />
			{!matchs.length && !loading ? <Box>La round n'est pas encore lancé ou n'a pas été MAJ</Box> : ''}
			{matchs.length ? (
				<Grid container spacing={2} sx={{ mb: 2 }}>
					<Grid item xs={12} sm={6} md={4} size={{ xs: 12, sm: 6, md: 4 }}>
						<RoundSearch value={search} onChange={setSearch} />
					</Grid>
				</Grid>
			) : null}

			{error && error !== 'ROUND_NOT_FOUND' && <Box sx={{ mt: 2 }}>Error: {error}</Box>}

			{!matchs.length ? (
				loading ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
						<CircularProgress />
					</Box>
				) : null
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
											(p) => p.player_order === 1 || match.match_is_bye || match.match_is_loss,
										).player.id,
									)}
									player2Deck={
										!match.match_is_bye &&
										!match.match_is_loss &&
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
