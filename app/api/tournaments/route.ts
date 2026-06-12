import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { ApiResponse } from '@/src/lib/api/responses';

export async function GET() {
	try {
		const tournaments = await TournamentRepository.findAll();
		return ApiResponse.ok(tournaments);
	} catch (err) {
		return ApiResponse.serverError(err);
	}
}
