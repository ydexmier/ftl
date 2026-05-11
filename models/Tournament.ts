import mongoose, { Schema, Document, Model } from 'mongoose';
import type { RoundType } from '@/src/types/round';

export interface ITournamentRound {
	id: number;
	round_number: number;
	final_round_in_event: boolean;
	pairings_status: string;
	standings_status: string;
	round_type: RoundType;
	status: string;
}

export interface ITournamentPhase {
	id: number;
	first_round_type: string | null;
	status: string;
	order_in_phases: number;
	number_of_rounds: number;
	round_type: RoundType;
	rank_required_to_enter_phase: string | null;
	rounds: ITournamentRound[];
}

export interface ITournament extends Document {
	id: number;
	name: string;
	description: string;
	full_header_image_url: string;
	start_datetime: Date;
	end_datetime: Date | null;
	timer_end_datetime: Date | null;
	timer_paused_at_datetime: Date | null;
	timer_is_running: boolean;
	registered_user_count: number;
	full_address: string;
	latitude: number;
	longitude: number;
	game_type: string;
	event_status: string;
	event_format: string;
	event_type: string;
	rules_enforcement_level: string;
	store: {
		id: number;
		name: string;
		full_address: string;
		administrative_area_level_1_short: string;
		country: string;
		website: string;
		latitude: number;
		longitude: number;
	};
	settings: {
		id: number;
		decklist_status: string;
		event_lifecycle_status: string;
		show_registration_button: boolean;
		round_duration_in_minutes: number;
		payment_in_store: boolean;
		payment_on_spicerack: boolean;
		maximum_number_of_game_wins_per_match: number;
		maximum_number_of_draws_per_match: number | null;
		checkin_methods: string[];
		stripe_price_id: string | null;
	};
	tournament_phases: ITournamentPhase[];
	gameplay_format: {
		id: string;
		name: string;
		description: string;
	};
	coordinates?: {
		type: 'Point';
		coordinates: [number, number];
	};
	cost_in_cents: number;
	currency: string;
	capacity: number;
	number_of_days: number;
	url: string | null;
	timezone: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export const RoundSchema = new Schema<ITournamentRound>({
	id: Number,
	round_number: Number,
	final_round_in_event: Boolean,
	pairings_status: String,
	standings_status: String,
	round_type: String,
	status: String,
});

const TournamentPhaseSchema = new Schema<ITournamentPhase>({
	id: Number,
	first_round_type: String,
	status: String,
	order_in_phases: Number,
	number_of_rounds: Number,
	round_type: String,
	rank_required_to_enter_phase: String,
	rounds: [RoundSchema],
});

const TournamentSchema = new Schema<ITournament>(
	{
		id: { type: Number, unique: true },
		name: String,
		description: String,
		full_header_image_url: String,
		start_datetime: Date,
		end_datetime: Date,
		timer_end_datetime: Date,
		timer_paused_at_datetime: Date,
		timer_is_running: Boolean,
		registered_user_count: Number,
		full_address: String,
		latitude: Number,
		longitude: Number,
		game_type: String,
		event_status: String,
		event_format: String,
		event_type: String,
		rules_enforcement_level: String,
		store: {
			id: Number,
			name: String,
			full_address: String,
			administrative_area_level_1_short: String,
			country: String,
			website: String,
			latitude: Number,
			longitude: Number,
		},
		settings: {
			id: Number,
			decklist_status: String,
			event_lifecycle_status: String,
			show_registration_button: Boolean,
			round_duration_in_minutes: Number,
			payment_in_store: Boolean,
			payment_on_spicerack: Boolean,
			maximum_number_of_game_wins_per_match: Number,
			maximum_number_of_draws_per_match: Number,
			checkin_methods: [String],
			stripe_price_id: String,
		},
		tournament_phases: [TournamentPhaseSchema],
		gameplay_format: {
			id: String,
			name: String,
			description: String,
		},
		coordinates: {
			type: {
				type: String,
				enum: ['Point'],
				default: 'Point',
			},
			coordinates: {
				type: [Number],
			},
		},
		cost_in_cents: Number,
		currency: String,
		capacity: Number,
		number_of_days: Number,
		url: String,
		timezone: String,
	},
	{ timestamps: true },
);

if (process.env.NODE_ENV === 'development') {
	TournamentSchema.set('autoIndex', true);
}

const TournamentModel: Model<ITournament> =
	(mongoose.models.Tournament as Model<ITournament>) ||
	mongoose.model<ITournament>('Tournament', TournamentSchema);

export default TournamentModel;
