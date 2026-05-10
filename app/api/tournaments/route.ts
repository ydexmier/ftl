import { NextRequest } from 'next/server';
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

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const tournament = await TournamentRepository.upsert(body);
		return ApiResponse.ok(tournament);
	} catch (err) {
		return ApiResponse.serverError(err);
	}
}
