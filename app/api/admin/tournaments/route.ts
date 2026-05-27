import { NextRequest } from 'next/server';
import { TournamentService } from '@/src/services/TournamentService';
import { ApiResponse } from '@/src/lib/api/responses';
import { requireAdminSession } from '@/src/lib/auth/getAuthSession';

export async function DELETE(request: NextRequest) {
	const result = await requireAdminSession(request);
	if ('error' in result) return result.error;

	const { id } = await request.json();
	if (!id) return ApiResponse.badRequest('Tournament id requis');

	try {
		const result2 = await TournamentService.delete(Number(id));
		return ApiResponse.ok({
			message: `Tournament ${id} et ses données associées supprimés avec succès`,
			...result2,
		});
	} catch (err) {
		const msg = (err as Error).message;
		if (msg.includes('not found')) return ApiResponse.notFound(msg);
		return ApiResponse.serverError(err);
	}
}
