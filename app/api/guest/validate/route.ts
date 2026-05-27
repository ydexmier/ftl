import { NextRequest, NextResponse } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import { signGuestCookie, GUEST_COOKIE, GUEST_COOKIE_MAX_AGE } from '@/src/lib/auth/guestSession';
import { ApiResponse } from '@/src/lib/api/responses';

export async function POST(request: NextRequest) {
  const { token, displayName } = await request.json();

  if (!token) return ApiResponse.badRequest('token requis');

  const trimmedName = (displayName ?? '').trim();
  if (!trimmedName) return ApiResponse.badRequest('Le prénom ou pseudo est requis');
  if (trimmedName.length > 50) return ApiResponse.badRequest('Le pseudo ne peut pas dépasser 50 caractères');
  // Le pipe est le séparateur du cookie signé — on l'interdit dans le pseudo
  if (trimmedName.includes('|')) return ApiResponse.badRequest('Le pseudo ne peut pas contenir le caractère |');

  await connectToMongoDB();

  const access = await TournamentExternalAccessRepository.findByAccessToken(token);
  if (!access) return ApiResponse.notFound('Lien invalide ou expiré');
  if (access.status === 'REVOKED') return ApiResponse.forbidden('Cet accès a été révoqué');
  if (access.status === 'EXPIRED' || access.expiresAt < new Date()) {
    return ApiResponse.forbidden('Ce lien a expiré');
  }

  const updated = await TournamentExternalAccessRepository.setDisplayName(String(access._id), trimmedName);
  if (!updated) return ApiResponse.serverError('Erreur lors de la mise à jour');

  const cookieValue = await signGuestCookie({
    accessId: String(access._id),
    tournamentId: access.tournamentId,
    groupId: String(access.groupId),
    displayName: trimmedName,
  });

  const response = NextResponse.json({
    tournamentId: access.tournamentId,
    groupId: String(access.groupId),
    displayName: trimmedName,
  });

  response.cookies.set(GUEST_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: GUEST_COOKIE_MAX_AGE,
    path: '/',
  });

  return response;
}
