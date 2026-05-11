import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserTournamentStatus {
	id: number;
	matches_won: number;
	matches_drawn: number;
	matches_lost: number;
	total_match_points: number;
	full_profile_picture_url?: string;
	registration_status: string;
	best_identifier: string;
}

export interface IRankingPlayer {
	id: number;
	best_identifier: string;
}

export interface IRankingEntry {
	rank: number;
	player: IRankingPlayer;
	user_tournament_status: IUserTournamentStatus;
	record: string;
	match_record: string;
	match_points: number;
	opponent_match_win_percentage: number;
	opponent_game_win_percentage: number;
}

export interface IRanking extends Document {
	id_tournament: number;
	page_size: number;
	count: number;
	total: number;
	current_page_number: number;
	next_page_number: number | null;
	next: number | null;
	previous: number | null;
	previous_page_number: number | null;
	results: IRankingEntry[];
}

const UserTournamentStatusSchema = new Schema<IUserTournamentStatus>({
	id: { type: Number, required: true },
	matches_won: { type: Number, required: true },
	matches_drawn: { type: Number, required: true },
	matches_lost: { type: Number, required: true },
	total_match_points: { type: Number, required: true },
	full_profile_picture_url: { type: String },
	registration_status: { type: String, required: true },
	best_identifier: { type: String, required: true },
});

const RankingPlayerSchema = new Schema<IRankingPlayer>({
	id: { type: Number, required: true },
	best_identifier: { type: String, required: true },
});

const RankingEntrySchema = new Schema<IRankingEntry>({
	rank: { type: Number, required: true },
	player: { type: RankingPlayerSchema, required: true },
	user_tournament_status: { type: UserTournamentStatusSchema, required: true },
	record: { type: String, required: true },
	match_record: { type: String, required: true },
	match_points: { type: Number, required: true },
	opponent_match_win_percentage: { type: Number, required: true },
	opponent_game_win_percentage: { type: Number, required: true },
});

const RankingSchema = new Schema<IRanking>({
	id_tournament: { type: Number, required: true },
	page_size: { type: Number, required: true },
	count: { type: Number, required: true },
	total: { type: Number, required: true },
	current_page_number: { type: Number, required: true },
	next_page_number: { type: Number, default: null },
	next: { type: Number, default: null },
	previous: { type: Number, default: null },
	previous_page_number: { type: Number, default: null },
	results: { type: [RankingEntrySchema], required: true },
});

const RankingModel: Model<IRanking> =
	(mongoose.models.Ranking as Model<IRanking>) ||
	mongoose.model<IRanking>('Ranking', RankingSchema);

export default RankingModel;
