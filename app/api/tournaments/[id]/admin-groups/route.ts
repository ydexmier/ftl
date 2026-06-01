import { NextRequest } from 'next/server';
import { getAuthSession } from '@/src/lib/auth/getAuthSession';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { GroupRepository } from '@/src/repositories/db/GroupRepository';
import { ApiResponse } from '@/src/lib/api/responses';

type Params = { params: Promise<{ id: string }> };

/**
 * Retourne les groupes liés à ce tournoi où l'utilisateur courant est admin.
 * Utilisé pour afficher le bouton admin-groupe sur la page tournoi.
 */
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await getAuthSession(request);
  if (!auth) return ApiResponse.unauthorized();

  const { id } = await params;
  const tournamentId = Number(id);
  if (isNaN(tournamentId)) return ApiResponse.badRequest('ID invalide');

  const groupTournaments = await GroupTournamentRepository.findGroupsByTournamentId(tournamentId);
  if (groupTournaments.length === 0) return ApiResponse.ok({ groups: [] });

  const adminGroups: { groupId: string; groupName: string }[] = [];

  await Promise.all(
    groupTournaments.map(async (gt) => {
      const groupId = String(gt.groupId);
      const isAdmin = await GroupRepository.isAdmin(groupId, auth.userId);
      if (isAdmin) {
        const group = await GroupRepository.findById(groupId);
        if (group) {
          adminGroups.push({ groupId, groupName: group.name });
        }
      }
    }),
  );

  return ApiResponse.ok({ groups: adminGroups });
}
