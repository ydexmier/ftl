// models/Tournament.js
import mongoose from 'mongoose';

export const RoundSchema = new mongoose.Schema({
	id: Number,
	round_number: Number,
	final_round_in_event: Boolean,
	pairings_status: String,
	standings_status: String,
	round_type: String,
	status: String,
});

const TournamentPhaseSchema = new mongoose.Schema({
	id: Number,
	first_round_type: String,
	status: String,
	order_in_phases: Number,
	number_of_rounds: Number,
	round_type: String,
	rank_required_to_enter_phase: String,
	rounds: [RoundSchema],
});

const TournamentSchema = new mongoose.Schema(
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
				type: [Number], // [longitude, latitude]
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

// ⚡ configure AVANT de compiler le modèle
if (process.env.NODE_ENV === 'development') {
	TournamentSchema.set('autoIndex', true);
}

// ⚡ compile après config
let Tournament;

try {
	Tournament = mongoose.model('Tournament');
} catch {
	Tournament = mongoose.model('Tournament', TournamentSchema);
}

export default Tournament;
