/**
 * @jest-environment node
 */

jest.mock('@/src/lib/db', () => ({ __esModule: true, default: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/src/lib/auth/cookieSign', () => ({ __esModule: true, verifyCookie: jest.fn() }));
jest.mock('@/src/lib/auth/session', () => ({ __esModule: true, getSession: jest.fn() }));

import mongoose from 'mongoose';
import { DELETE } from '@/app/api/admin/users/[id]/sessions/route';
import UserModel from '@models/User';
import SessionModel from '@models/Session';
import AuditLogModel from '@models/AuditLog';
import { verifyCookie } from '@/src/lib/auth/cookieSign';
import { getSession } from '@/src/lib/auth/session';
import { ADMIN_USER_ID, TARGET_USER_ID, MOCK_SESSION, makeRequest, makeUnauthorizedRequest } from '../../../helpers/mockAuth';
import { mockChain, buildMockUser } from '../../../helpers/modelMocks';

const BASE_URL = 'http://localhost/api/admin/users';

const mockTargetUser = buildMockUser({ _id: TARGET_USER_ID, username: 'target', email: 'target@test.com' });

function idSessionsParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(verifyCookie).mockResolvedValue({ sessionId: 'mock-session-id', role: 'ADMIN' });
  jest.mocked(getSession).mockResolvedValue(MOCK_SESSION as never);

  jest.spyOn(UserModel, 'findById').mockReturnValue(mockChain(mockTargetUser) as never);
  jest.spyOn(SessionModel, 'deleteMany').mockResolvedValue({ deletedCount: 3 } as never);
  jest.spyOn(AuditLogModel, 'create').mockResolvedValue({} as never);
});

// ── DELETE /api/admin/users/[id]/sessions ─────────────────────────────────────

describe('DELETE /api/admin/users/[id]/sessions', () => {
  it('returns 204 when revoking all sessions', async () => {
    const req = makeRequest('DELETE', `${BASE_URL}/${TARGET_USER_ID}/sessions`);
    const res = await DELETE(req, idSessionsParams(TARGET_USER_ID.toString()));
    expect(res.status).toBe(204);
  });

  it('calls SessionModel.deleteMany for the target user', async () => {
    const deleteManySessionsSpy = jest.spyOn(SessionModel, 'deleteMany').mockResolvedValue({ deletedCount: 3 } as never);

    const req = makeRequest('DELETE', `${BASE_URL}/${TARGET_USER_ID}/sessions`);
    await DELETE(req, idSessionsParams(TARGET_USER_ID.toString()));

    expect(deleteManySessionsSpy).toHaveBeenCalledWith({ userId: TARGET_USER_ID.toString() });
  });

  it('does NOT delete sessions of other users', async () => {
    const deleteManySessionsSpy = jest.spyOn(SessionModel, 'deleteMany').mockResolvedValue({ deletedCount: 3 } as never);

    const req = makeRequest('DELETE', `${BASE_URL}/${TARGET_USER_ID}/sessions`);
    await DELETE(req, idSessionsParams(TARGET_USER_ID.toString()));

    const otherUserId = new mongoose.Types.ObjectId();
    // Verify that only target user's sessions are deleted (not others)
    expect(deleteManySessionsSpy).not.toHaveBeenCalledWith({ userId: otherUserId.toString() });
    expect(deleteManySessionsSpy).toHaveBeenCalledTimes(1);
  });

  it('calls AuditLogModel.create with ADMIN_ACTION and REVOKE_SESSIONS metadata', async () => {
    const auditCreateSpy = jest.spyOn(AuditLogModel, 'create').mockResolvedValue({} as never);

    const req = makeRequest('DELETE', `${BASE_URL}/${TARGET_USER_ID}/sessions`);
    await DELETE(req, idSessionsParams(TARGET_USER_ID.toString()));

    expect(auditCreateSpy).toHaveBeenCalledWith(expect.objectContaining({
      action: 'ADMIN_ACTION',
      metadata: expect.objectContaining({
        action: 'REVOKE_SESSIONS',
        targetUserId: TARGET_USER_ID.toString(),
      }),
    }));
  });

  it('returns 204 even when user has no sessions (idempotent)', async () => {
    jest.spyOn(SessionModel, 'deleteMany').mockResolvedValue({ deletedCount: 0 } as never);

    const req = makeRequest('DELETE', `${BASE_URL}/${TARGET_USER_ID}/sessions`);
    const res = await DELETE(req, idSessionsParams(TARGET_USER_ID.toString()));
    expect(res.status).toBe(204);
  });

  it('returns 404 for non-existent user ID', async () => {
    jest.spyOn(UserModel, 'findById').mockReturnValue(mockChain(null) as never);

    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const req = makeRequest('DELETE', `${BASE_URL}/${nonExistentId}/sessions`);
    const res = await DELETE(req, idSessionsParams(nonExistentId));
    expect(res.status).toBe(404);
  });

  it('returns 404 for malformed user ID', async () => {
    const req = makeRequest('DELETE', `${BASE_URL}/bad-id/sessions`);
    const res = await DELETE(req, idSessionsParams('bad-id'));
    expect(res.status).toBe(404);
  });

  it('returns 401 without session cookie', async () => {
    const req = makeUnauthorizedRequest('DELETE', `${BASE_URL}/${TARGET_USER_ID}/sessions`);
    const res = await DELETE(req, idSessionsParams(TARGET_USER_ID.toString()));
    expect(res.status).toBe(401);
  });

  it('returns 401 when verifyCookie returns null', async () => {
    jest.mocked(verifyCookie).mockResolvedValue(null);
    const req = makeRequest('DELETE', `${BASE_URL}/${TARGET_USER_ID}/sessions`);
    const res = await DELETE(req, idSessionsParams(TARGET_USER_ID.toString()));
    expect(res.status).toBe(401);
  });

  it('returns 401 when session is not found', async () => {
    jest.mocked(getSession).mockResolvedValue(null);
    const req = makeRequest('DELETE', `${BASE_URL}/${TARGET_USER_ID}/sessions`);
    const res = await DELETE(req, idSessionsParams(TARGET_USER_ID.toString()));
    expect(res.status).toBe(401);
  });
});
