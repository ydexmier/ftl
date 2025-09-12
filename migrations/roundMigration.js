// migrate_rounds.js
import dotenv from 'dotenv';
import Round from '@models/Round.js'; // ajuste le chemin selon ton projet
import connectToMongoDB from '@components/scooting/utils/connectToMongoDB.mjs';

dotenv.config(); // charge .env si nécessaire (MONGO_URI)

async function migrate() {
	try {
		await connectToMongoDB();

		console.log('🔄 Migration en cours...');

		const result = await Round.updateMany(
			{
				$or: [
					{ 'results.player_match_relationships.player.deck': { $exists: false } },
					{ 'results.player_match_relationships.player.probable_decks': { $exists: false } },
				],
			},
			{
				$set: {
					'results.$[].player_match_relationships.$[].player.deck': { inks: [] },
					'results.$[].player_match_relationships.$[].player.probable_decks': [],
				},
			},
		);

		console.log(`✅ Migration terminée :
    ${result.matchedCount} documents trouvés
    ${result.modifiedCount} documents modifiés`);

		process.exit(0);
	} catch (err) {
		console.error('❌ Erreur pendant la migration :', err);
		process.exit(1);
	}
}

migrate();
