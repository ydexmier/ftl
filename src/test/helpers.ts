import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import UserModel from '@models/User';
import SessionModel from '@models/Session';
import { hashPassword } from '@/src/lib/auth/password';
import { signCookie } from '@/src/lib/auth/cookieSign';
import type { UserRole } from '@models/User';

export const DEFAULT_PASSWORD = 'TestPassword1!';

export async function createTestUser(overrides: Partial<{
  username: string;
  email: string;
  password: string;
  role: UserRole;
}> = {}) {
  const passwordHash = await hashPassword(overrides.password ?? DEFAULT_PASSWORD);
  return UserModel.create({
    username: overrides.username ?? 'testuser',
    email: overrides.email ?? 'test@example.com',
    passwordHash,
    role: overrides.role ?? 'USER',
  });
}

export async function createAdminUser(overrides: Partial<{ username: string; email: string }> = {}) {
  return createTestUser({ username: 'admin', email: 'admin@example.com', role: 'ADMIN', ...overrides });
}

export async function createAuthCookie(userId: string | mongoose.Types.ObjectId, role: string) {
  const sessionId = crypto.randomUUID();
  await SessionModel.create({
    sessionId,
    userId,
    role,
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    lastActivityAt: new Date(),
  });
  return signCookie(sessionId, role);
}

export function makeRequest(
  method: string,
  url: string,
  body?: unknown,
  cookieValue?: string,
): NextRequest {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (cookieValue) headers['Cookie'] = `session=${cookieValue}`;

  return new NextRequest(`http://localhost:3000${url}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
