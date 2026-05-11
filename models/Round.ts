import mongoose, { Schema, Document, Model } from 'mongoose';
import type { Player, UserEventStatus } from '@/src/types/player';
import TournamentPlayersDeck from '@models/TournamentPlayersDeck.js';

// Force import of TournamentPlayersDeck before virtual registration
void TournamentPlayersDeck;

export interface IPlayerMatchRelationship {
	player_order: number;
	player: Player;
	user_event_status: UserEventStatus;
}

export interface IMatch {
	id: number;
	player_match_relationships: IPlayerMatchRelationship[];
	created_at: Date | null;
	updated_at: Date | null;
	table_number: number;
	order: number;
	status: string;
	pod_number: number | null;
	match_is_intentional_draw: boolean;
	match_is_unintentional_draw: boolean;
	match_is_bye: boolean;
	match_is_loss: boolean;
	reports_are_in_conflict: boolean;
	games_drawn: number | null;
	games_won_by_winner: number | null;
	games_won_by_loser: number | null;
	is_ghost_match: boolean;
	is_feature_match: boolean;
	deck_check_started: boolean;
	deck_check_completed: boolean;
	time_extension_seconds: number;
	team_event_match: unknown | null;
	tournament_round: number;
	reporting_player: unknown | null;
	winning_player: unknown | null;
	assigned_judge: unknown | null;
	players: number[];
}

export interface IRound extends Document {
	id: number;
	tournamentId: number;
	results: IMatch[];
	createdAt: Date;
	updatedAt: Date;
}

const DeckSchema = new Schema({ inks: { type: [String], default: [] } }, { _id: false });

const PlayerSchema = new Schema({
	id: Number,
	pronouns: { type: String, default: null },
	best_identifier: String,
	game_user_profile_picture_url: String,
});

const PlayerMatchRelationshipSchema = new Schema<IPlayerMatchRelationship>(
	{
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
	},
	{ _id: false },
);

const MatchSchema = new Schema<IMatch>({
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
	team_event_match: { type: Schema.Types.Mixed, default: null },
	tournament_round: Number,
	reporting_player: { type: Schema.Types.Mixed, default: null },
	winning_player: { type: Schema.Types.Mixed, default: null },
	assigned_judge: { type: Schema.Types.Mixed, default: null },
	players: [Number],
});

const RoundSchema = new Schema<IRound>(
	{
		id: Number,
		tournamentId: { type: Number, required: true },
		results: [MatchSchema],
	},
	{ timestamps: true },
);

RoundSchema.virtual('playersDecks', {
	ref: 'TournamentPlayersDeck',
	localField: 'tournamentId',
	foreignField: 'tournamentId',
	justOne: true,
});

RoundSchema.set('toJSON', { virtuals: true });
RoundSchema.set('toObject', { virtuals: true });
RoundSchema.index({ tournamentId: 1 });

if (process.env.NODE_ENV === 'development') {
	RoundSchema.set('autoIndex', true);
}

const RoundModel: Model<IRound> =
	(mongoose.models.Round as Model<IRound>) ||
	mongoose.model<IRound>('Round', RoundSchema);

export default RoundModel;
export { DeckSchema };
