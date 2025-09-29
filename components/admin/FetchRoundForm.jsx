'use client';
import { useState } from 'react';
import { Box, Button, Alert, Typography, Select, FormControl, MenuItem, Divider } from '@mui/material';
import { getRoundName } from '@components/scooting/utils/roundToString';
import { fetchRound } from 'lib/api/fetchRound';

const ITEM_PER_PAGE = 200;
export default function FetchRoundForm({ tournament, phases = [] }) {
	const [loadingId, setLoadingId] = useState(null);
	const [message, setMessage] = useState('');
	const [round, setRound] = useState();

	const handleRunRound = async (page, perPage) => {
		setLoadingId(round);
		setMessage('');

		try {
			const res = await fetchRound(tournament.id, round, { page, perPage });
			setMessage(`✅ Script exécuté pour le round ${round}`);
		} catch (err) {
			setMessage(`❌ ${err.message}`);
		} finally {
			setLoadingId(null);
		}
	};

	const fetchAllMatchs = async () => {
		if (!round) return;
		setLoadingId(round);
		setMessage('');

		try {
			let page = 1;
			let totalFetched = 0;
			let totalMatches = 0;
			let fetchedCount = 0;
			do {
				setMessage(`Fetching ${fetchedCount} matches, total fetched: ${totalFetched}/${totalMatches || '?'}`);
				const res = await fetchRound(tournament.id, round, { page, perPage: ITEM_PER_PAGE });
				if (page === 1 && res.datas.totalExternalAPIcount) {
					totalMatches = res.datas.totalExternalAPIcount;
				}
				fetchedCount = res.datas.results ? res.datas.results.length : 0;
				totalFetched += fetchedCount;
				page += 1;
			} while (totalFetched < totalMatches && totalMatches > 0);
			setMessage(`✅ Tous les matchs du round ${round} ont été fetchés (${totalFetched} au total)`);
		} catch (err) {
			setMessage(`❌ ${err.message}`);
		} finally {
			setLoadingId(null);
		}
	};

	if (phases.length === 0) {
		return <Typography>Aucune phase de tournoi disponible</Typography>;
	}

	return (
		<div>
			{phases.map((phase, idx) => (
				<Box key={idx} mb={2}>
					<Typography variant="subtitle1" gutterBottom>
						Phase: {phase.name} ({phase.round_type})
					</Typography>
					<Box sx={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'column', gap: 2, mb: 2 }}>
						{phase.rounds.length === 0 ? (
							<Typography>Aucune round disponible</Typography>
						) : (
							<>
								<FormControl
									size="small"
									sx={{ minWidth: 120, display: 'flex', flexDirection: 'row', gap: 2 }}
								>
									<Select
										value={round}
										onChange={(e) => {
											setRound(Number(e.target.value));
										}}
									>
										{phase.rounds.map((r) => (
											<MenuItem key={r.id} value={r.id}>
												{getRoundName(phase, r)}
											</MenuItem>
										))}
									</Select>
									<Button
										variant="contained"
										onClick={() => fetchAllMatchs()}
										disabled={loadingId === round}
									>
										{loadingId === round ? 'Exécution en cours...' : 'Fetch all matches'}
									</Button>
								</FormControl>
								{round && (
									<Box>
										{[...Array(Math.floor(tournament.registered_user_count / ITEM_PER_PAGE))].map(
											(_, page) => (
												<Button onClick={() => handleRunRound(page + 1, ITEM_PER_PAGE)}>
													match {page * ITEM_PER_PAGE + 1} -{' '}
													{page * ITEM_PER_PAGE + ITEM_PER_PAGE}
												</Button>
											),
										)}
									</Box>
								)}
							</>
						)}
					</Box>
				</Box>
			))}

			{message && (
				<Alert severity={loadingId ? 'info' : message.startsWith('✅') ? 'success' : 'error'} sx={{ mt: 2 }}>
					{message}
				</Alert>
			)}
		</div>
	);
}
