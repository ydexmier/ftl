import mongoose from 'mongoose';
import fetchRound from '../services/fetchRound.mjs';
import Round from '@models/Round.js'; // adapte le chemin
import mergeDeep from '../utils/mergeDeep.mjs';
import connectToMongoDB from '../utils/connectToMongoDB.mjs';
import Tournament from '@models/Tournament.js';

// Fonction pour insérer ou mettre à jour le tournoi
async function upsertRound(newData) {
	try {
		const existingRound = await Round.findOne({ id: newData.id });

		if (existingRound) {
			if (existingRound.status === 'COMPLETED') {
				console.log('Mise à jour indisponible, la round a déja été cloturé.');
			}
			if (newData.status === 'UPCOMING') {
				console.log("La round précédente n'est pas encore cloturé.");
				return newData;
			}

			if (existingRound.status === 'IN_PROGRESS') {
				if (newData.pairings_status === 'GENERATED') {
					mergeDeep(existingRound, { ...newData, last_fetch: new Date() });
					await existingRound.save();
					console.log(`Round ${newData.id} mis à jour`);
				} else {
					console.log('Les pairing ne sont pas encore disponible.');
					return existingRound;
				}
			}
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
async function fetchAndUpsertRound(idRound, tournamentId) {
	try {
		const res = await fetchRound(idRound);
		if (!res) throw new Error(`Fetch failed`);
		const response = await upsertRound({ ...res, id: idRound, tournamentId });
		return response;
	} catch (error) {
		throw error;
	}
}

export default async function fetchAndSaveRound(tournamentId, idRound) {
	try {
		await connectToMongoDB(); // 🔹 ajouter await ici

		if (!tournamentId || !idRound) {
			throw new Error('Merci de fournir un tournamentId et idRound en argument, ex: node fetchAndUpsertRound.js');
		}
		const tournament = await Tournament.findOne({ id: tournamentId });
		if (!tournament) {
			throw new Error(`Tournoi ${tournamentId} introuvable en base`);
		}
		const roundsInTournament = tournament.tournament_phases.flatMap((phase) => phase.rounds);

		const actualRoundSettings = roundsInTournament.find((round) => round.id === idRound);
		if (!actualRoundSettings) {
			throw new Error(`Round ${idRound} introuvable dans le tournoi ${tournamentId}`);
		}

		const response = await fetchAndUpsertRound(idRound, tournamentId);

		return response;
	} catch (err) {
		console.error('Erreur principale:', err);
		throw err;
	}
}
