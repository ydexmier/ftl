import { NextRequest } from 'next/server';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { AuditLogRepository } from '@/src/repositories/db/AuditLogRepository';
import { ApiResponse } from '@/src/lib/api/responses';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { getIp } from '@/src/lib/auth/getIp';

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

export async function DELETE(req: NextRequest, { params }: Params) {
	const session = await getAuthSession(req);
	if (!session) return ApiResponse.unauthorized();
	if (session.role !== 'ADMIN' && session.role !== 'SUPERUSER') return ApiResponse.forbidden();

	try {
		const { id } = await params;
		const deleted = await TournamentRepository.deleteById(Number(id));
		if (!deleted) return ApiResponse.notFound('Tournament not found');

		await AuditLogRepository.create({
			action: 'ADMIN_ACTION',
			userId: session.userId,
			ipAddress: getIp(req),
			metadata: { action: 'TOURNAMENT_DELETE', tournamentId: Number(id) },
		});

		return ApiResponse.ok({ message: 'Tournament deleted' });
	} catch (err) {
		return ApiResponse.serverError(err);
	}
}
