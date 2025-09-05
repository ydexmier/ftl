import mongoose from 'mongoose';
import fetchTournement from '../services/fetchTournement.mjs';
import Tournament from '../models/Tournament.js'; // adapte le chemin
import mergeDeep from '../utils/mergeDeep.mjs';
import connectToMongoDB from '../utils/connectToMongoDB.mjs';
import { upsertTournamentPlayersDeck } from '../controllers/TournamentPlayersDeck.mjs';

// Fonction pour insérer ou mettre à jour le tournoi
async function upsertTournament(newData) {
	try {
		const existingTournament = await Tournament.findOne({ id: newData.id });

		if (existingTournament) {
			mergeDeep(existingTournament, newData);
			await existingTournament.save();
			console.log(`Tournoi ${newData.id} mis à jour`);
		} else {
			const tournament = new Tournament(newData);
			await tournament.save();
			console.log(`Tournoi ${newData.id} inséré`);
		}
	} catch (err) {
		console.error('Erreur lors de la mise à jour ou insertion :', err);
	}
}

// Fonction principale : fetch + upsert
async function fetchAndUpsertTournament(id) {
	try {
		const res = await fetchTournement(id);

		if (res?.id !== Number(id)) throw new Error(`Fetch failed`);

		await upsertTournament(res);
		console.log(`Appel upsertTournamentPlayersDeck pour le tournoi ${JSON.stringify(res.id)}`);
		await upsertTournamentPlayersDeck({ id: res.id, players: [] });
	} catch (error) {
		console.error('Erreur dans fetchAndUpsertTournament:', error);
	}
}

export default async function fetchAndSaveTournament(id) {
	try {
		await connectToMongoDB(); // 🔹 ajouter await ici

		if (!id) {
			throw new Error('Merci de fournir un id en argument, ex: node fetchAndUpsertTournament.js 159805');
		}

		await fetchAndUpsertTournament(id);

		await mongoose.disconnect();
		console.log('Déconnexion MongoDB');
	} catch (err) {
		console.error('Erreur principale:', err);
	}
}
