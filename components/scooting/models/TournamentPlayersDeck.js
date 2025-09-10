import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema(
	{
		playerId: { type: Number, required: true },
		pronouns: { type: String, default: null },
		best_identifier: String,
		game_user_profile_picture_url: String,
		decks: { type: [[String]], default: () => [] },
	},
	{ _id: false },
);

// Schema principal
const TournamentPlayersDeckSchema = new mongoose.Schema(
	{
		tournamentId: { type: Number, unique: true },
		players: [PlayerSchema],
	},
	{ timestamps: true },
);

// ⚡ autoIndex en dev
if (process.env.NODE_ENV === 'development') {
	TournamentPlayersDeckSchema.set('autoIndex', true);
}

// Compile le modèle (sécurisé pour éviter double compilation)
const TournamentPlayersDeck =
	mongoose.models.TournamentPlayersDeck || mongoose.model('TournamentPlayersDeck', TournamentPlayersDeckSchema);

export default TournamentPlayersDeck;
