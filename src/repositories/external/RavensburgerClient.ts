const BASE_URL = 'https://api.ravensburgerplay.com/api/v2';
const CLOUDFLARE_BASE_URL = 'https://api.cloudflare.ravensburgerplay.com/hydraproxy/api/v2';

async function get<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`RavensburgerAPI HTTP ${res.status} — ${url}`);
	return res.json() as Promise<T>;
}

export interface RawTournament {
	id: number;
	name: string;
	[key: string]: unknown;
}

export interface RawRoundPage {
	page_size: number;
	count: number;
	total: number;
	current_page_number: number;
	next_page_number: number | null;
	previous_page_number: number | null;
	results: unknown[];
}

export interface RawRankingPage {
	page_size: number;
	count: number;
	total: number;
	current_page_number: number;
	next_page_number: number | null;
	previous_page_number: number | null;
	results: unknown[];
}

export interface RawRegistrationUser {
	id: number;
	best_identifier: string;
	pronouns: string | null;
}

export interface RawRegistration {
	id: number;
	user: RawRegistrationUser;
	registration_status: string;
	best_identifier: string;
}

export interface RawRegistrationPage {
	page_size: number;
	count: number;
	total: number;
	current_page_number: number;
	next_page_number: number | null;
	previous_page_number: number | null;
	results: RawRegistration[];
}

export const RavensburgerClient = {
	fetchTournament(id: number): Promise<RawTournament> {
		return get<RawTournament>(`${BASE_URL}/events/${id}/`);
	},

	fetchRound(id: number, page = 1, pageSize = 10000): Promise<RawRoundPage> {
		return get<RawRoundPage>(
			`${BASE_URL}/tournament-rounds/${id}/matches/paginated/?page=${page}&page_size=${pageSize}&avoid_cache=true`,
		);
	},

	fetchRank(id: number, page = 1, pageSize = 100): Promise<RawRankingPage> {
		return get<RawRankingPage>(
			`${BASE_URL}/tournament-rounds/${id}/standings/paginated/?page=${page}&page_size=${pageSize}&avoid_cache=true`,
		);
	},

	fetchRegistrations(tournamentId: number, page = 1, pageSize = 100): Promise<RawRegistrationPage> {
		return get<RawRegistrationPage>(
			`${CLOUDFLARE_BASE_URL}/events/${tournamentId}/registrations/?page=${page}&page_size=${pageSize}`,
		);
	},
};
