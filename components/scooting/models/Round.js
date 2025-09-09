import mongoose from 'mongoose';
import TournamentPlayersDeck from './TournamentPlayersDeck.js'; // ⚡ important: importer avant la virtual

// Sous-schemas
const DeckSchema = new mongoose.Schema({ inks: { type: [String], default: [] } }, { _id: false });

const PlayerSchema = new mongoose.Schema({
	id: Number,
	pronouns: { type: String, default: null },
	best_identifier: String,
	game_user_profile_picture_url: String,
});

const PlayerMatchRelationshipSchema = new mongoose.Schema({
	player_order: Number,
	player: PlayerSchema,
	user_event_status: {
		id: Number,
		best_identifier: String,
		registration_status: String,
		matches_won: Number,
		matches_lost: Number,
		matches_drawn: Number,
		total_match_points: Number,
		user: {
			id: Number,
			pronouns: { type: String, default: null },
			best_identifier: String,
			game_user_profile_picture_url: String,
		},
	},
});

const MatchSchema = new mongoose.Schema({
	id: { type: Number, unique: true },
	player_match_relationships: [PlayerMatchRelationshipSchema],
	created_at: Date,
	updated_at: Date,
	table_number: Number,
	order: Number,
	status: String,
	pod_number: { type: Number, default: null },
	match_is_intentional_draw: Boolean,
	match_is_unintentional_draw: Boolean,
	match_is_bye: Boolean,
	match_is_loss: Boolean,
	reports_are_in_conflict: Boolean,
	games_drawn: { type: Number, default: null },
	games_won_by_winner: { type: Number, default: null },
	games_won_by_loser: { type: Number, default: null },
	is_ghost_match: Boolean,
	is_feature_match: Boolean,
	deck_check_started: Boolean,
	deck_check_completed: Boolean,
	time_extension_seconds: Number,
	team_event_match: { type: mongoose.Schema.Types.Mixed, default: null },
	tournament_round: Number,
	reporting_player: { type: mongoose.Schema.Types.Mixed, default: null },
	winning_player: { type: mongoose.Schema.Types.Mixed, default: null },
	assigned_judge: { type: mongoose.Schema.Types.Mixed, default: null },
	players: [Number],
});

// Schema principal
const RoundSchema = new mongoose.Schema({
	id: Number,
	tournamentId: { type: Number, required: true },
	results: [MatchSchema],
}, { timestamps: true });

// ⚡ virtual pour lier les decks des joueurs
RoundSchema.virtual('playersDecks', {
	ref: 'TournamentPlayersDeck',
	localField: 'tournamentId',
	foreignField: 'tournamentId',
	justOne: true,
});

// Virtuals dans toJSON/toObject
RoundSchema.set('toJSON', { virtuals: true });
RoundSchema.set('toObject', { virtuals: true });

// autoIndex en dev
if (process.env.NODE_ENV === 'development') {
	RoundSchema.set('autoIndex', true);
}

// Compile le modèle Round
const Round = mongoose.models.Round || mongoose.model('Round', RoundSchema);

export default Round;
export { DeckSchema };
