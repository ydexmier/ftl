import type { RoundRef, RoundType } from './round';

export interface Store {
	id: number;
	name: string;
	fullAddress: string;
	administrativeAreaLevel1Short: string;
	country: string;
	website: string;
	latitude: number;
	longitude: number;
}

export interface TournamentSettings {
	id: number;
	decklistStatus: string;
	eventLifecycleStatus: string;
	showRegistrationButton: boolean;
	roundDurationInMinutes: number;
	paymentInStore: boolean;
	paymentOnSpicerack: boolean;
	maximumNumberOfGameWinsPerMatch: number;
	maximumNumberOfDrawsPerMatch: number | null;
	checkinMethods: string[];
	stripePriceId: string | null;
}

export interface GameplayFormat {
	id: string;
	name: string;
	description: string;
}

export interface TournamentPhase {
	id: number;
	firstRoundType: string | null;
	status: string;
	orderInPhases: number;
	numberOfRounds: number;
	roundType: RoundType;
	rankRequiredToEnterPhase: string | null;
	rounds: RoundRef[];
}

export interface Tournament {
	id: number;
	name: string;
	description: string;
	fullHeaderImageUrl: string;
	startDatetime: string;
	endDatetime: string | null;
	timerEndDatetime: string | null;
	timerPausedAtDatetime: string | null;
	timerIsRunning: boolean;
	registeredUserCount: number;
	fullAddress: string;
	latitude: number;
	longitude: number;
	gameType: string;
	eventStatus: string;
	eventFormat: string;
	eventType: string;
	rulesEnforcementLevel: string;
	store: Store;
	settings: TournamentSettings;
	tournamentPhases: TournamentPhase[];
	gameplayFormat: GameplayFormat;
	costInCents: number;
	currency: string;
	capacity: number;
	numberOfDays: number;
	url: string | null;
	timezone: string | null;
	createdAt: string;
	updatedAt: string;
}
