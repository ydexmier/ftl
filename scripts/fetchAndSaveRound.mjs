import mongoose from 'mongoose';
import fetchRound from './lib/fetchRound.mjs';
import Round from '../components/scooting/models/Round.js'; // adapte le chemin
import mergeDeep from '../components/scooting/utils/mergeDeep.mjs';
import connectToMongoDB from '../components/scooting/utils/connectToMongoDB.mjs';
import Tournament from '../components/scooting/models/Tournament.js';

// Fonction pour insérer ou mettre à jour le tournoi
async function upsertRound(newData) {
	try {
		const existingRound = await Round.findOne({ id: newData.id });

		if (existingRound) {
			mergeDeep(existingRound, newData);
			await existingRound.save();
			console.log(`Round ${newData.id} mis à jour`);
		} else {
			const round = new Round(newData);
			await round.save();
			console.log(`Round ${newData.id} inséré`);
		}
	} catch (err) {
		console.error('Erreur lors de la mise à jour ou insertion :', err);
	}
}

// Fonction principale : fetch + upsert
async function fetchAndUpsertRound(idRound, tournamentId) {
	try {
		const res = await fetchRound(idRound);
		if (!res) throw new Error(`Fetch failed`);
		await upsertRound({ ...res, id: idRound, tournamentId });
	} catch (error) {
		console.error('Erreur dans fetchAndUpsertRound:', error);
	}
}

async function main() {
	try {
		await connectToMongoDB(); // 🔹 ajouter await ici

		const tournamentId = process.argv[2];
		const idRound = Number(process.argv[3]);
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
		console.log(`Fetch et upsert du round ${idRound} du tournoi ${tournamentId}`);
		await fetchAndUpsertRound(idRound, tournamentId);

		await mongoose.disconnect();
		console.log('Déconnexion MongoDB');
	} catch (err) {
		console.error('Erreur principale:', err);
		await mongoose.disconnect();
		console.log('Déconnexion MongoDB');
	}
}

main();
