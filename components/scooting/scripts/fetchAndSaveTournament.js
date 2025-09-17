import fetchTournement from '@lib/external/fetchTournement.mjs';
import Tournament from '@models/Tournament.js'; // adapte le chemin
import mergeDeep from '../utils/mergeDeep.mjs';
import connectToMongoDB from '../utils/connectToMongoDB.mjs';
import { upsertTournamentPlayersDeck } from '@controllers/TournamentPlayersDeck.mjs';

// Fonction pour insérer ou mettre à jour le tournoi
async function upsertTournament(newData, isRefetch) {
	try {
		const existingTournament = await Tournament.findOne({ id: newData.id });
		console.log(existingTournament && !isRefetch);
		if (!isRefetch && existingTournament) throw new Error('Le tournoi existe déjà');
		if (existingTournament) {
			mergeDeep(existingTournament, newData);
			await existingTournament.save();
			console.log(`Tournoi ${newData.id} mis à jour`);
			return existingTournament;
		} else {
			const tournament = new Tournament(newData);
			await tournament.save();
			console.log(`Tournoi ${newData.id} inséré`);
			return tournament;
		}
	} catch (err) {
		throw err;
	}
}

// Fonction principale : fetch + upsert
async function fetchAndUpsertTournament(id, isRefetch) {
	try {
		const res = await fetchTournement(id);

		if (res?.id !== Number(id)) throw new Error(`Fetch failed`);
		const response = await upsertTournament(res, isRefetch);
		console.log(`Appel upsertTournamentPlayersDeck pour le tournoi ${JSON.stringify(res.id)}`);
		if (!isRefetch) await upsertTournamentPlayersDeck({ id: res.id, players: [] });
		return response;
	} catch (error) {
		throw error;
	}
}

export default async function fetchAndSaveTournament(id, isRefetch = false) {
	try {
		await connectToMongoDB(); // 🔹 ajouter await ici

		if (!id) {
			throw new Error('Merci de fournir un id en argument, ex: node fetchAndUpsertTournament.js 159805');
		}

		const response = await fetchAndUpsertTournament(id, isRefetch);

		return response;
	} catch (err) {
		console.error('Erreur principale:', err);
		throw err;
	}
}
