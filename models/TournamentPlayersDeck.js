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

// Schema principal — scoped par groupId (groupe) OU userId (personnel)
const TournamentPlayersDeckSchema = new mongoose.Schema(
	{
		tournamentId: { type: Number, required: true },
		groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
		players: [PlayerSchema],
	},
	{ timestamps: true },
);

// Index de recherche rapide par scope
TournamentPlayersDeckSchema.index({ tournamentId: 1, groupId: 1, userId: 1 });

if (process.env.NODE_ENV === 'development') {
	TournamentPlayersDeckSchema.set('autoIndex', true);
}

const TournamentPlayersDeck =
	mongoose.models.TournamentPlayersDeck || mongoose.model('TournamentPlayersDeck', TournamentPlayersDeckSchema);

export default TournamentPlayersDeck;
