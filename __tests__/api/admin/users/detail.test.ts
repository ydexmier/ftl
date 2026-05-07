/**
 * @jest-environment node
 */

jest.mock('@/src/lib/db', () => ({ __esModule: true, default: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/src/lib/auth/cookieSign', () => ({ __esModule: true, verifyCookie: jest.fn() }));
jest.mock('@/src/lib/auth/session', () => ({ __esModule: true, getSession: jest.fn() }));
jest.mock('@/src/lib/auth/password', () => ({ __esModule: true,
  hashPassword: jest.fn().mockResolvedValue('$argon2id$new$hash'),
  validatePasswordStrength: (p: string) => {
    if (p.length < 12) return { valid: false, message: 'Minimum 12 caracteres.' };
    if (!/[A-Z]/.test(p)) return { valid: false, message: 'Une majuscule requise.' };
    if (!/[a-z]/.test(p)) return { valid: false, message: 'Une minuscule requise.' };
    if (!/[0-9]/.test(p)) return { valid: false, message: 'Un chiffre requis.' };
    if (!/[^A-Za-z0-9]/.test(p)) return { valid: false, message: 'Un caractere special requis.' };
    return { valid: true };
  },
}));

import mongoose from 'mongoose';
import { GET, PATCH, DELETE } from '@/app/api/admin/users/[id]/route';
import UserModel from '@models/User';
import SessionModel from '@models/Session';
import AuditLogModel from '@models/AuditLog';
import { verifyCookie } from '@/src/lib/auth/cookieSign';
import { getSession } from '@/src/lib/auth/session';
import { ADMIN_USER_ID, TARGET_USER_ID, MOCK_SESSION, makeRequest, makeUnauthorizedRequest } from '../../../helpers/mockAuth';
import { mockChain, buildMockUser, buildMockSession, buildMockAuditLog } from '../../../helpers/modelMocks';

const BASE_URL = 'http://localhost/api/admin/users';
const STRONG_PASSWORD = 'Test@Password123!';

const mockTargetUser = buildMockUser({
  _id: TARGET_USER_ID,
  username: 'target',
  email: 'target@test.com',
  role: 'USER',
});

const mockTargetUserNoHash = {
  _id: TARGET_USER_ID,
  username: 'target',
  email: 'target@test.com',
  role: 'USER',
  createdAt: mockTargetUser.createdAt,
  updatedAt: mockTargetUser.updatedAt,
};

function makeIdRequest(method: string, id: string, body?: unknown) {
  return makeRequest(method, `${BASE_URL}/${id}`, body);
}

function makeIdUnauthorizedRequest(method: string, id: string) {
  return makeUnauthorizedRequest(method, `${BASE_URL}/${id}`);
}

function idParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(verifyCookie).mockResolvedValue({ sessionId: 'mock-session-id', role: 'ADMIN' });
  jest.mocked(getSession).mockResolvedValue(MOCK_SESSION as never);

  // Default model spies
  jest.spyOn(UserModel, 'findById').mockReturnValue(mockChain(mockTargetUserNoHash) as never);
  jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);
  jest.spyOn(UserModel, 'find').mockReturnValue(mockChain([]) as never);
  jest.spyOn(UserModel, 'updateOne').mockResolvedValue({ modifiedCount: 1 } as never);
  jest.spyOn(UserModel, 'deleteOne').mockResolvedValue({ deletedCount: 1 } as never);
  jest.spyOn(SessionModel, 'countDocuments').mockResolvedValue(0);
  jest.spyOn(SessionModel, 'create').mockResolvedValue({} as never);
  jest.spyOn(SessionModel, 'deleteMany').mockResolvedValue({ deletedCount: 0 } as never);
  jest.spyOn(AuditLogModel, 'find').mockReturnValue(mockChain([]) as never);
  jest.spyOn(AuditLogModel, 'create').mockResolvedValue({} as never);
  jest.spyOn(AuditLogModel, 'findOne').mockResolvedValue(null);
});

// ── GET /api/admin/users/[id] ─────────────────────────────────────────────────

describe('GET /api/admin/users/[id]', () => {
  it('returns 200 with { user, activeSessions, recentLogs }', async () => {
    const req = makeIdRequest('GET', TARGET_USER_ID.toString());
    const res = await GET(req, idParams(TARGET_USER_ID.toString()));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty('user');
    expect(data).toHaveProperty('activeSessions');
    expect(data).toHaveProperty('recentLogs');
    expect(data.user.username).toBe('target');
  });

  it('does not expose passwordHash in user object', async () => {
    const req = makeIdRequest('GET', TARGET_USER_ID.toString());
    const res = await GET(req, idParams(TARGET_USER_ID.toString()));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user).not.toHaveProperty('passwordHash');
  });

  it('returns activeSessions=0 when no active sessions', async () => {
    jest.spyOn(SessionModel, 'countDocuments').mockResolvedValue(0);

    const req = makeIdRequest('GET', TARGET_USER_ID.toString());
    const res = await GET(req, idParams(TARGET_USER_ID.toString()));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.activeSessions).toBe(0);
  });

  it('returns correct activeSessions count when sessions exist', async () => {
    jest.spyOn(SessionModel, 'countDocuments').mockResolvedValue(2);

    const req = makeIdRequest('GET', TARGET_USER_ID.toString());
    const res = await GET(req, idParams(TARGET_USER_ID.toString()));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.activeSessions).toBe(2);
  });

  it('returns recentLogs with audit logs for user', async () => {
    const logs = [
      buildMockAuditLog(TARGET_USER_ID, 'LOGIN_SUCCESS'),
      buildMockAuditLog(TARGET_USER_ID, 'LOGIN_FAIL'),
    ];
    jest.spyOn(AuditLogModel, 'find').mockReturnValue(mockChain(logs) as never);

    const req = makeIdRequest('GET', TARGET_USER_ID.toString());
    const res = await GET(req, idParams(TARGET_USER_ID.toString()));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.recentLogs.length).toBe(2);
  });

  it('returns 404 for non-existent ID', async () => {
    jest.spyOn(UserModel, 'findById').mockReturnValue(mockChain(null) as never);

    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const req = makeIdRequest('GET', nonExistentId);
    const res = await GET(req, idParams(nonExistentId));
    expect(res.status).toBe(404);
  });

  it('returns 404 for malformed ID', async () => {
    const req = makeIdRequest('GET', 'not-valid-id');
    const res = await GET(req, idParams('not-valid-id'));
    expect(res.status).toBe(404);
  });

  it('returns 401 without session cookie', async () => {
    const req = makeIdUnauthorizedRequest('GET', TARGET_USER_ID.toString());
    const res = await GET(req, idParams(TARGET_USER_ID.toString()));
    expect(res.status).toBe(401);
  });
});

// ── PATCH /api/admin/users/[id] ───────────────────────────────────────────────

describe('PATCH /api/admin/users/[id]', () => {
  const updatedUser = { ...mockTargetUserNoHash, username: 'updated' };

  beforeEach(() => {
    // findById used twice: once to get user, once to return updated user
    let callCount = 0;
    jest.spyOn(UserModel, 'findById').mockImplementation(() => {
      callCount++;
      if (callCount === 1) return mockChain(mockTargetUser) as never;
      return mockChain(updatedUser) as never;
    });
  });

  it('updates username and returns 200', async () => {
    jest.spyOn(UserModel, 'findById').mockReturnValue(mockChain(mockTargetUser) as never);
    jest.spyOn(UserModel, 'findOne').mockResolvedValue(null); // no conflicts
    const updatedResult = { ...mockTargetUserNoHash, username: 'updated' };
    let callCount = 0;
    jest.spyOn(UserModel, 'findById').mockImplementation(() => {
      callCount++;
      return mockChain(callCount === 1 ? mockTargetUser : updatedResult) as never;
    });

    const req = makeIdRequest('PATCH', TARGET_USER_ID.toString(), { username: 'updated' });
    const res = await PATCH(req, idParams(TARGET_USER_ID.toString()));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.username).toBe('updated');
  });

  it('updates email and returns 200', async () => {
    const updatedWithEmail = { ...mockTargetUserNoHash, email: 'new@email.com' };
    let callCount = 0;
    jest.spyOn(UserModel, 'findById').mockImplementation(() => {
      callCount++;
      return mockChain(callCount === 1 ? mockTargetUser : updatedWithEmail) as never;
    });

    const req = makeIdRequest('PATCH', TARGET_USER_ID.toString(), { email: 'new@email.com' });
    const res = await PATCH(req, idParams(TARGET_USER_ID.toString()));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.email).toBe('new@email.com');
  });

  it('updates role and returns 200', async () => {
    const updatedWithRole = { ...mockTargetUserNoHash, role: 'ADMIN' };
    let callCount = 0;
    jest.spyOn(UserModel, 'findById').mockImplementation(() => {
      callCount++;
      return mockChain(callCount === 1 ? mockTargetUser : updatedWithRole) as never;
    });

    const req = makeIdRequest('PATCH', TARGET_USER_ID.toString(), { role: 'ADMIN' });
    const res = await PATCH(req, idParams(TARGET_USER_ID.toString()));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.role).toBe('ADMIN');
  });

  it('updates password → calls hashPassword and creates PASSWORD_CHANGED log', async () => {
    const { hashPassword } = require('@/src/lib/auth/password');
    const auditCreateSpy = jest.spyOn(AuditLogModel, 'create').mockResolvedValue({} as never);
    let callCount = 0;
    jest.spyOn(UserModel, 'findById').mockImplementation(() => {
      callCount++;
      return mockChain(callCount === 1 ? mockTargetUser : mockTargetUserNoHash) as never;
    });

    const req = makeIdRequest('PATCH', TARGET_USER_ID.toString(), { password: STRONG_PASSWORD });
    const res = await PATCH(req, idParams(TARGET_USER_ID.toString()));

    expect(res.status).toBe(200);
    expect(hashPassword).toHaveBeenCalledWith(STRONG_PASSWORD);
    expect(auditCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ action: 'PASSWORD_CHANGED' }));
  });

  it('updates multiple fields at once', async () => {
    const multi = { ...mockTargetUserNoHash, username: 'multiupdate', email: 'multi@test.com', role: 'ADMIN' };
    let callCount = 0;
    jest.spyOn(UserModel, 'findById').mockImplementation(() => {
      callCount++;
      return mockChain(callCount === 1 ? mockTargetUser : multi) as never;
    });

    const req = makeIdRequest('PATCH', TARGET_USER_ID.toString(), {
      username: 'multiupdate',
      email: 'multi@test.com',
      role: 'ADMIN',
    });
    const res = await PATCH(req, idParams(TARGET_USER_ID.toString()));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.username).toBe('multiupdate');
    expect(data.user.email).toBe('multi@test.com');
    expect(data.user.role).toBe('ADMIN');
  });

  it('calls AuditLogModel.create with USER_UPDATED and correct updatedFields', async () => {
    const auditCreateSpy = jest.spyOn(AuditLogModel, 'create').mockResolvedValue({} as never);
    let callCount = 0;
    jest.spyOn(UserModel, 'findById').mockImplementation(() => {
      callCount++;
      return mockChain(callCount === 1 ? mockTargetUser : mockTargetUserNoHash) as never;
    });

    const req = makeIdRequest('PATCH', TARGET_USER_ID.toString(), { username: 'audited', email: 'audit@test.com' });
    await PATCH(req, idParams(TARGET_USER_ID.toString()));

    expect(auditCreateSpy).toHaveBeenCalledWith(expect.objectContaining({
      action: 'USER_UPDATED',
      metadata: expect.objectContaining({
        updatedFields: expect.arrayContaining(['username', 'email']),
      }),
    }));
  });

  it('returns 409 when username is taken by another user', async () => {
    jest.spyOn(UserModel, 'findById').mockReturnValue(mockChain(mockTargetUser) as never);
    jest.spyOn(UserModel, 'findOne').mockResolvedValue(buildMockUser({ username: 'takenname' }) as never);

    const req = makeIdRequest('PATCH', TARGET_USER_ID.toString(), { username: 'takenname' });
    const res = await PATCH(req, idParams(TARGET_USER_ID.toString()));
    expect(res.status).toBe(409);
  });

  it('returns 409 when email is taken by another user', async () => {
    jest.spyOn(UserModel, 'findById').mockReturnValue(mockChain(mockTargetUser) as never);
    jest.spyOn(UserModel, 'findOne').mockResolvedValue(buildMockUser({ email: 'taken@test.com' }) as never);

    const req = makeIdRequest('PATCH', TARGET_USER_ID.toString(), { email: 'taken@test.com' });
    const res = await PATCH(req, idParams(TARGET_USER_ID.toString()));
    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid email format', async () => {
    jest.spyOn(UserModel, 'findById').mockReturnValue(mockChain(mockTargetUser) as never);

    const req = makeIdRequest('PATCH', TARGET_USER_ID.toString(), { email: 'bad-email' });
    const res = await PATCH(req, idParams(TARGET_USER_ID.toString()));
    expect(res.status).toBe(400);
  });

  it('returns 400 for weak password', async () => {
    jest.spyOn(UserModel, 'findById').mockReturnValue(mockChain(mockTargetUser) as never);

    const req = makeIdRequest('PATCH', TARGET_USER_ID.toString(), { password: 'weak' });
    const res = await PATCH(req, idParams(TARGET_USER_ID.toString()));
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent user', async () => {
    jest.spyOn(UserModel, 'findById').mockReturnValue(mockChain(null) as never);

    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const req = makeIdRequest('PATCH', nonExistentId, { username: 'ghost' });
    const res = await PATCH(req, idParams(nonExistentId));
    expect(res.status).toBe(404);
  });

  it('returns 404 for malformed ID', async () => {
    const req = makeIdRequest('PATCH', 'bad-id', { username: 'ghost' });
    const res = await PATCH(req, idParams('bad-id'));
    expect(res.status).toBe(404);
  });

  it('returns 401 without session cookie', async () => {
    const req = makeIdUnauthorizedRequest('PATCH', TARGET_USER_ID.toString());
    const res = await PATCH(req, idParams(TARGET_USER_ID.toString()));
    expect(res.status).toBe(401);
  });
});

// ── DELETE /api/admin/users/[id] ──────────────────────────────────────────────

describe('DELETE /api/admin/users/[id]', () => {
  beforeEach(() => {
    jest.spyOn(UserModel, 'findById').mockReturnValue(mockChain(mockTargetUser) as never);
    jest.spyOn(SessionModel, 'deleteMany').mockResolvedValue({ deletedCount: 2 } as never);
    jest.spyOn(UserModel, 'deleteOne').mockResolvedValue({ deletedCount: 1 } as never);
    jest.spyOn(AuditLogModel, 'create').mockResolvedValue({} as never);
  });

  it('deletes user and returns 204', async () => {
    const req = makeIdRequest('DELETE', TARGET_USER_ID.toString());
    const res = await DELETE(req, idParams(TARGET_USER_ID.toString()));
    expect(res.status).toBe(204);
  });

  it('calls UserModel.deleteOne with target user ID', async () => {
    const deleteOneSpy = jest.spyOn(UserModel, 'deleteOne').mockResolvedValue({ deletedCount: 1 } as never);

    const req = makeIdRequest('DELETE', TARGET_USER_ID.toString());
    await DELETE(req, idParams(TARGET_USER_ID.toString()));

    expect(deleteOneSpy).toHaveBeenCalledWith({ _id: TARGET_USER_ID.toString() });
  });

  it('calls SessionModel.deleteMany to remove user sessions', async () => {
    const deleteManySessionsSpy = jest.spyOn(SessionModel, 'deleteMany').mockResolvedValue({ deletedCount: 2 } as never);

    const req = makeIdRequest('DELETE', TARGET_USER_ID.toString());
    await DELETE(req, idParams(TARGET_USER_ID.toString()));

    expect(deleteManySessionsSpy).toHaveBeenCalledWith({ userId: TARGET_USER_ID.toString() });
  });

  it('calls AuditLogModel.create with USER_DELETED action', async () => {
    const auditCreateSpy = jest.spyOn(AuditLogModel, 'create').mockResolvedValue({} as never);

    const req = makeIdRequest('DELETE', TARGET_USER_ID.toString());
    await DELETE(req, idParams(TARGET_USER_ID.toString()));

    expect(auditCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_DELETED' }));
  });

  it('returns 400 when admin tries to delete their own account', async () => {
    const req = makeIdRequest('DELETE', ADMIN_USER_ID.toString());
    jest.spyOn(UserModel, 'findById').mockReturnValue(mockChain(
      buildMockUser({ _id: ADMIN_USER_ID, username: 'admin' })
    ) as never);
    const res = await DELETE(req, idParams(ADMIN_USER_ID.toString()));
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent user', async () => {
    jest.spyOn(UserModel, 'findById').mockReturnValue(mockChain(null) as never);

    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const req = makeIdRequest('DELETE', nonExistentId);
    const res = await DELETE(req, idParams(nonExistentId));
    expect(res.status).toBe(404);
  });

  it('returns 404 for malformed ID', async () => {
    const req = makeIdRequest('DELETE', 'invalid-id');
    const res = await DELETE(req, idParams('invalid-id'));
    expect(res.status).toBe(404);
  });

  it('returns 401 without session cookie', async () => {
    const req = makeIdUnauthorizedRequest('DELETE', TARGET_USER_ID.toString());
    const res = await DELETE(req, idParams(TARGET_USER_ID.toString()));
    expect(res.status).toBe(401);
  });
});
