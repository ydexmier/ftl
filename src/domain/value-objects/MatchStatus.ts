export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE' | 'CANCELLED';

export type MuiColor = 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

export interface MatchStatusDisplay {
	label: string;
	color: MuiColor;
}
