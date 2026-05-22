import { RavensburgerClient } from '@/src/repositories/external/RavensburgerClient';
import { TournamentRegistrationRepository } from '@/src/repositories/db/TournamentRegistrationRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import type { IRegisteredPlayer } from '@models/TournamentRegistration';

function toPlayerInfo(p: IRegisteredPlayer) {
	return {
		id: p.playerId,
		best_identifier: p.realName,
		pronouns: null,
		eventBestIdentifier: p.name,
	};
}

export const RegistrationService = {
	async fetchAndSave(tournamentId: number) {
		const PAGE_SIZE = 300;
		const first = await RavensburgerClient.fetchRegistrations(tournamentId, 1, PAGE_SIZE);
		const total = first.total;
		const pageCount = Math.ceil(total / PAGE_SIZE);

		const remaining = Array.from({ length: pageCount - 1 }, (_, i) => i + 2);
		const rest = await Promise.all(
			remaining.map((p) => RavensburgerClient.fetchRegistrations(tournamentId, p, PAGE_SIZE)),
		);

		const allResults = [...first.results, ...rest.flatMap((page) => page.results)];

		const players: IRegisteredPlayer[] = allResults.map((r) => ({
			registrationId: r.id,
			playerId: r.user.id,
			name: r.best_identifier,
			realName: r.user.best_identifier,
			registrationStatus: r.registration_status,
		}));

		await TournamentRegistrationRepository.upsert(tournamentId, players, total);

		// Propagate to any existing TournamentPlayersDeck scopes for this tournament
		if (players.length > 0) {
			await TournamentPlayersDeckRepository.upsertMissingPlayersAllExisting(
				tournamentId,
				players.map(toPlayerInfo),
			);
		}

		return { totalCount: total, players };
	},

	async getStatus(tournamentId: number) {
		const [registration, tournamentStarted] = await Promise.all([
			TournamentRegistrationRepository.findByTournamentId(tournamentId),
			RoundRepository.existsByTournamentId(tournamentId),
		]);

		return {
			lastFetchedAt: registration?.lastFetchedAt ?? null,
			totalCount: registration?.totalCount ?? 0,
			tournamentStarted,
		};
	},

	toPlayerInfo,
};
