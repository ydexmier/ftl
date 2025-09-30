import fetchRound from '@lib/external/fetchRound.mjs';
import Round from '@models/Round.js';
import mergeDeep, { mergeArrayById } from '../utils/mergeDeep.mjs';
import connectToMongoDB from '../utils/connectToMongoDB.mjs';
import Tournament from '@models/Tournament.js';
import { FETCH_ALL_ASYNC } from 'constants/index.js';

const useAsyncFetch = process.env.NEXT_PUBLIC_USE_ASYNC_FETCH === 'true';

function mergeTournamentData(target, source) {
	for (const key in source) {
		if (key === 'results') {
			mergeArrayById(target.results || (target.results = []), source.results);
		} else if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
			if (!target[key]) target[key] = {};
			mergeDeep(target[key], source[key]);
		} else {
			target[key] = source[key];
		}
	}
	return target;
}
// Fonction pour insérer ou mettre à jour le tournoi
async function upsertRound(newData) {
	try {
		const existingRound = await Round.findOne({ id: newData.id });
		if (existingRound) {
			mergeTournamentData(existingRound, newData);
			await existingRound.save();
			console.log(`Round ${newData.id} mis à jour`);
		} else {
			const round = new Round(newData);
			await round.save();
			console.log(`Round ${newData.id} inséré`);
		}
		const roundWithPlayers = await Round.findOne({ id: Number(newData.id) })
			.populate('playersDecks') // ⚡ auto-merge des joueurs
			.lean();

		return roundWithPlayers;
	} catch (err) {
		console.error('Erreur lors de la mise à jour ou insertion :', err);
		throw err;
	}
}

// Fonction principale : fetch + upsert
async function fetchAndUpsertRound(idRound, tournamentId, options = {}) {
	try {
		const { page = 1, perPage = 10, search = '', mode } = options;
		const currentPage = Math.max(parseInt(page, 10), 1);
		const limit = Math.max(parseInt(perPage, 10), 1);

		const shouldFetchAllAsync = useAsyncFetch && mode === FETCH_ALL_ASYNC.mode;
		let pageToFetch = mode === FETCH_ALL_ASYNC.mode ? 1 : page;
		let totalFetched = 0;
		let totalMatches = 0;
		let fetchedCount = 0;
		let res = null;
		const promiseToExecute = [];
		res = await fetchRound(idRound, pageToFetch, shouldFetchAllAsync ? FETCH_ALL_ASYNC.perPage : perPage);
		if (pageToFetch === 1 && res.total) {
			totalMatches = res.total;
		}
		fetchedCount = res.results ? res.results.length : 0;
		totalFetched += fetchedCount;
		console.log(`✅ Page ${pageToFetch} fetchée, ${fetchedCount} matchs (${totalFetched}/${totalMatches || '?'})`);
		while (totalFetched < totalMatches && totalMatches > 0 && shouldFetchAllAsync) {
			pageToFetch += 1;
			promiseToExecute.push(
				new Promise((resolve, reject) =>
					fetchRound(idRound, pageToFetch, FETCH_ALL_ASYNC.perPage).then(resolve).catch(reject),
				),
			);
			totalFetched += perPage;
		}
		if (promiseToExecute.length > 0) {
			const results = await Promise.all(promiseToExecute);
			results.forEach((result) => {
				if (result && result.results) {
					res.results.push(...result.results);
				}
			});
		}
		console.log(`✅ Tous les matchs du round ${idRound} ont été fetchés (${totalMatches} au total)`);
		const response = await upsertRound({ ...res, id: idRound, tournamentId });
		console.log(`✅ Tous les matchs du round ${idRound} ont été enregistré en base de données`);

		// 2️⃣ Pagination des matchs
		let filteredRound = { ...response };

		if (search.trim()) {
			const isNumeric = !isNaN(search); // ✅ test si c’est un nombre
			const lowerSearch = search.toLowerCase();

			filteredRound.results = (response.results || []).filter((match) => {
				if (isNumeric) {
					// 🔎 filtre sur le numéro de table
					return String(match.table_number) === search;
				}

				// 🔎 sinon, filtre sur joueurs
				return match.player_match_relationships.some(
					(pmr) =>
						pmr.player?.best_identifier?.toLowerCase().includes(lowerSearch) ||
						pmr.user_event_status?.best_identifier?.toLowerCase().includes(lowerSearch),
				);
			});
		}
		totalMatches = filteredRound.results.length;
		const totalPages = Math.ceil(totalMatches / limit);
		const paginatedResults = filteredRound.results.slice((currentPage - 1) * limit, currentPage * limit);

		// 3️⃣ Récupérer tous les playerIds présents dans la page
		const playerIdsInPage = paginatedResults.flatMap((match) =>
			(match.player_match_relationships || []).map((pmr) => pmr.player?.id).filter(Boolean),
		);

		// 4️⃣ Filtrer les decks pour ne garder que les joueurs présents
		let filteredPlayersDecks = [];
		if (filteredRound.playersDecks && filteredRound.playersDecks.players) {
			filteredPlayersDecks = {
				tournamentId: filteredRound.playersDecks.tournamentId,
				players: filteredRound.playersDecks.players.filter((p) => playerIdsInPage.includes(p.playerId)),
			};
		}

		return {
			results: paginatedResults,
			playersDecks: filteredPlayersDecks,
			pagination: {
				page: currentPage,
				perPage: limit,
				total: totalMatches,
				totalPages,
			},
			totalExternalAPIcount: res.total || 0,
			updatedAt: filteredRound.updatedAt,
		};
	} catch (error) {
		throw error;
	}
}

const fetchAndSaveRound = async (tournamentId, idRound, options = {}) => {
	try {
		await connectToMongoDB();
		const idRoundNumber = Number(idRound);
		if (!tournamentId || !idRoundNumber) {
			throw new Error('Merci de fournir un tournamentId et idRound en argument, ex: node fetchAndUpsertRound.js');
		}
		const tournament = await Tournament.findOne({ id: tournamentId });
		if (!tournament) {
			throw new Error(`Tournoi ${tournamentId} introuvable en base`);
		}
		const roundsInTournament = tournament.tournament_phases.flatMap((phase) => phase.rounds);

		const actualRoundSettings = roundsInTournament.find((round) => round.id === idRoundNumber);

		if (!actualRoundSettings) {
			throw new Error(`Round ${idRoundNumber} introuvable dans le tournoi ${tournamentId}`);
		}

		const response = await fetchAndUpsertRound(idRoundNumber, tournamentId, options);
		return response;
	} catch (err) {
		console.error('Erreur principale:', err);
		throw err;
	}
};

export default fetchAndSaveRound;
