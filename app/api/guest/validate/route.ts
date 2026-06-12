import { NextRequest, NextResponse } from 'next/server';
import { GroupMagicLinkRepository } from '@/src/repositories/db/GroupMagicLinkRepository';
import { TournamentExternalAccessRepository } from '@/src/repositories/db/TournamentExternalAccessRepository';
import { UserRepository } from '@/src/repositories/db/UserRepository';
import { hashPassword, validatePasswordStrength } from '@/src/lib/auth/password';
import { createSession, SESSION_COOKIE_MAX_AGE } from '@/src/lib/auth/session';
import { signCookie } from '@/src/lib/auth/cookieSign';
import { ApiResponse } from '@/src/lib/api/responses';
import { checkRateLimit } from '@/src/lib/auth/rateLimit';
import { getIp } from '@/src/lib/auth/getIp';

export async function POST(request: NextRequest) {
  const rl = checkRateLimit(`guest-validate:${getIp(request)}`);
  if (!rl.allowed) return ApiResponse.tooManyRequests(`Trop de tentatives. Réessayez dans ${Math.ceil((rl.retryAfter ?? 900) / 60)} minute(s).`);

  const { token, username, email, password } = await request.json();

  if (!token) return ApiResponse.badRequest('token requis');

  const trimmedUsername = (username ?? '').trim().toLowerCase();
  const trimmedEmail = (email ?? '').trim().toLowerCase();

  if (!trimmedUsername) return ApiResponse.badRequest('Le nom d\'utilisateur est requis');
  if (trimmedUsername.length < 3) return ApiResponse.badRequest('Le nom d\'utilisateur doit faire au moins 3 caractères');
  if (!/^[a-z0-9_-]+$/.test(trimmedUsername)) return ApiResponse.badRequest('Caractères autorisés : lettres, chiffres, _ et -');
  if (!trimmedEmail || !trimmedEmail.includes('@')) return ApiResponse.badRequest('Email invalide');
  if (!password) return ApiResponse.badRequest('Le mot de passe est requis');

  const pwCheck = validatePasswordStrength(password);
  if (!pwCheck.valid) return ApiResponse.badRequest(pwCheck.message ?? 'Mot de passe trop faible');

  const magicLink = await GroupMagicLinkRepository.findByToken(token);
  if (!magicLink) return ApiResponse.notFound('Lien invalide ou expiré');

  const [usernameTaken, emailTaken] = await Promise.all([
    UserRepository.existsByUsername(trimmedUsername),
    UserRepository.existsByEmail(trimmedEmail),
  ]);
  if (usernameTaken) return ApiResponse.conflict('Ce nom d\'utilisateur est déjà pris');
  if (emailTaken) return ApiResponse.conflict('Cet email est déjà utilisé');

  // À partir d'ici on écrit en DB — rollback compensatoire si la suite échoue
  const passwordHash = await hashPassword(password);
  const user = await UserRepository.create({
    username: trimmedUsername,
    email: trimmedEmail,
    passwordHash,
    role: 'USER',
    isGuest: true,
  });

  const userId = String(user._id);

  try {
    await TournamentExternalAccessRepository.createFromMagicLink({
      groupId: String(magicLink.groupId),
      tournamentId: magicLink.tournamentId,
      invitedBy: String(magicLink.createdBy),
      displayName: trimmedUsername,
      magicLinkToken: token,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const ua = request.headers.get('user-agent') ?? '';
    const sessionId = await createSession(userId, 'USER', getIp(request), ua);
    const cookieValue = await signCookie(sessionId, 'USER');

    const response = NextResponse.json({
      tournamentId: magicLink.tournamentId,
      groupId: String(magicLink.groupId),
    });
    response.cookies.set('session', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_COOKIE_MAX_AGE,
    });
    return response;
  } catch (err) {
    // Rollback : supprimer l'utilisateur et l'accès créés avant l'erreur
    await Promise.allSettled([
      UserRepository.delete(userId),
      TournamentExternalAccessRepository.deleteByUserId(userId),
    ]);
    return ApiResponse.serverError(err);
  }
}
