import { NextRequest } from 'next/server';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
	try {
		const { id } = await params;
		const tournament = await TournamentRepository.findById(Number(id));
		if (!tournament) return ApiResponse.notFound('Tournament not found');
		return ApiResponse.ok(tournament, { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=3600' });
	} catch (err) {
		return ApiResponse.serverError(err);
	}
}

export async function DELETE(_req: NextRequest, { params }: Params) {
	try {
		const { id } = await params;
		const deleted = await TournamentRepository.deleteById(Number(id));
		if (!deleted) return ApiResponse.notFound('Tournament not found');
		return ApiResponse.ok({ message: 'Tournament deleted' });
	} catch (err) {
		return ApiResponse.serverError(err);
	}
}
