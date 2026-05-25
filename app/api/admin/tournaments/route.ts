import { NextRequest } from 'next/server';
import { TournamentService } from '@/src/services/TournamentService';
import { ApiResponse } from '@/src/lib/api/responses';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { hasRole } from '@/src/lib/auth/rbac';
import type { UserRole } from '@models/User';

export async function DELETE(request: NextRequest) {
	const auth = await getAuthSession(request);
	if (!auth) return ApiResponse.unauthorized();
	if (!hasRole(auth.role as UserRole, 'ADMIN')) return ApiResponse.forbidden();

	const { id } = await request.json();
	if (!id) return ApiResponse.badRequest('Tournament id requis');

	try {
		const result = await TournamentService.delete(Number(id));
		return ApiResponse.ok({
			message: `Tournament ${id} et ses données associées supprimés avec succès`,
			...result,
		});
	} catch (err) {
		const msg = (err as Error).message;
		if (msg.includes('not found')) return ApiResponse.notFound(msg);
		return ApiResponse.serverError(err);
	}
}
