import type { RoundRef, RoundType } from './round';

export interface Store {
	id: number;
	name: string;
	full_address: string;
	administrative_area_level_1_short: string;
	country: string;
	website: string;
	latitude: number;
	longitude: number;
}

export interface TournamentSettings {
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
}

export interface GameplayFormat {
	id: string;
	name: string;
	description: string;
}

export interface TournamentPhase {
	id: number;
	name?: string;
	first_round_type: string | null;
	status: string;
	order_in_phases: number;
	number_of_rounds: number;
	round_type: RoundType;
	rank_required_to_enter_phase: string | null;
	rounds: RoundRef[];
}

export interface Tournament {
	id: number;
	name: string;
	description: string;
	full_header_image_url: string;
	start_datetime: string;
	end_datetime: string | null;
	timer_end_datetime: string | null;
	timer_paused_at_datetime: string | null;
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
	store: Store;
	settings: TournamentSettings;
	tournament_phases: TournamentPhase[];
	gameplay_format: GameplayFormat;
	cost_in_cents: number;
	currency: string;
	capacity: number;
	number_of_days: number;
	url: string | null;
	timezone: string | null;
	createdAt: string;
	updatedAt: string;
}
