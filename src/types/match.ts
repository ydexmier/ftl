import type { PlayerMatchRelationship } from './player';

export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE' | 'CANCELLED';

export interface Match {
	id: number;
	table_number: number;
	order: number;
	status: MatchStatus;
	pod_number: number | null;
	match_is_bye: boolean;
	match_is_intentional_draw: boolean;
	match_is_unintentional_draw: boolean;
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
	tournament_round: number;
	winning_player: number | null;
	reporting_player: number | null;
	assigned_judge: unknown | null;
	players: number[];
	player_match_relationships: PlayerMatchRelationship[];
	created_at: string;
	updated_at: string;
}

export interface MatchStatusResult {
	label: string;
	color: 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
}
