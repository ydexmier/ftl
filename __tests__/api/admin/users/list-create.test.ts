/**
 * @jest-environment node
 */

jest.mock('@/src/lib/db', () => ({ __esModule: true, default: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/src/lib/auth/cookieSign', () => ({ __esModule: true, verifyCookie: jest.fn() }));
jest.mock('@/src/lib/auth/session', () => ({ __esModule: true, getSession: jest.fn() }));
jest.mock('@/src/lib/auth/password', () => ({ __esModule: true,
  hashPassword: jest.fn().mockResolvedValue('$argon2id$mocked$hash'),
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
import { GET, POST } from '@/app/api/admin/users/route';
import UserModel from '@models/User';
import AuditLogModel from '@models/AuditLog';
import { verifyCookie } from '@/src/lib/auth/cookieSign';
import { getSession } from '@/src/lib/auth/session';
import { ADMIN_USER_ID, MOCK_SESSION, makeRequest, makeUnauthorizedRequest } from '../../../helpers/mockAuth';
import { mockChain, buildMockUser } from '../../../helpers/modelMocks';

const BASE_URL = 'http://localhost/api/admin/users';
const STRONG_PASSWORD = 'Test@Password123!';

const mockAdminUser = buildMockUser({ _id: ADMIN_USER_ID, username: 'admin', email: 'admin@test.com', role: 'ADMIN' });

function setupDefaultSpies() {
  jest.spyOn(UserModel, 'find').mockReturnValue(mockChain([]) as never);
  jest.spyOn(UserModel, 'countDocuments').mockResolvedValue(0);
  jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);
  jest.spyOn(UserModel, 'findById').mockReturnValue(mockChain(mockAdminUser) as never);
  jest.spyOn(UserModel, 'create').mockResolvedValue([] as never);
  jest.spyOn(UserModel, 'updateOne').mockResolvedValue({ modifiedCount: 1 } as never);
  jest.spyOn(UserModel, 'deleteOne').mockResolvedValue({ deletedCount: 1 } as never);
  jest.spyOn(AuditLogModel, 'create').mockResolvedValue({} as never);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(verifyCookie).mockResolvedValue({ sessionId: 'mock-session-id', role: 'ADMIN' });
  jest.mocked(getSession).mockResolvedValue(MOCK_SESSION as never);
  setupDefaultSpies();
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────

describe('GET /api/admin/users', () => {
  it('returns 200 with empty users list', async () => {
    jest.spyOn(UserModel, 'find').mockReturnValue(mockChain([]) as never);
    jest.spyOn(UserModel, 'countDocuments').mockResolvedValue(0);

    const req = makeRequest('GET', BASE_URL);
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.users)).toBe(true);
    expect(data.users.length).toBe(0);
    expect(data.total).toBe(0);
  });

  it('returns 200 with list of users (no passwordHash)', async () => {
    const users = [
      buildMockUser({ username: 'alice', email: 'alice@test.com' }),
      buildMockUser({ username: 'bob', email: 'bob@test.com', role: 'ADMIN' }),
    ];
    jest.spyOn(UserModel, 'find').mockReturnValue(mockChain(users) as never);
    jest.spyOn(UserModel, 'countDocuments').mockResolvedValue(2);

    const req = makeRequest('GET', BASE_URL);
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.users.length).toBe(2);
    expect(data.total).toBe(2);
    for (const user of data.users) {
      expect(user).not.toHaveProperty('passwordHash');
    }
  });

  it('passes pagination params to the query (page=2&limit=10)', async () => {
    const users = Array.from({ length: 10 }, (_, i) => buildMockUser({ username: `user${i}` }));
    jest.spyOn(UserModel, 'find').mockReturnValue(mockChain(users) as never);
    jest.spyOn(UserModel, 'countDocuments').mockResolvedValue(25);

    const req = makeRequest('GET', `${BASE_URL}?page=2&limit=10`);
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.page).toBe(2);
    expect(data.limit).toBe(10);
    expect(data.total).toBe(25);
  });

  it('passes search query to the filter', async () => {
    const user = buildMockUser({ username: 'searchable', email: 'searchable@test.com' });
    jest.spyOn(UserModel, 'find').mockReturnValue(mockChain([user]) as never);
    jest.spyOn(UserModel, 'countDocuments').mockResolvedValue(1);

    const req = makeRequest('GET', `${BASE_URL}?search=searchable`);
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.users.length).toBe(1);

    const findSpy = jest.spyOn(UserModel, 'find');
    await GET(makeRequest('GET', `${BASE_URL}?search=foo`));
    expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({
      $or: expect.any(Array),
    }));
  });

  it('passes role filter to the query', async () => {
    const adminUser = buildMockUser({ username: 'adminuser', role: 'ADMIN' });
    jest.spyOn(UserModel, 'find').mockReturnValue(mockChain([adminUser]) as never);
    jest.spyOn(UserModel, 'countDocuments').mockResolvedValue(1);

    const req = makeRequest('GET', `${BASE_URL}?role=ADMIN`);
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.users.length).toBe(1);

    const findSpy = jest.spyOn(UserModel, 'find');
    await GET(makeRequest('GET', `${BASE_URL}?role=USER`));
    expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({ role: 'USER' }));
  });

  it('returns 401 when no session cookie', async () => {
    const req = makeUnauthorizedRequest('GET', BASE_URL);
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when verifyCookie returns null', async () => {
    jest.mocked(verifyCookie).mockResolvedValue(null);
    const req = makeRequest('GET', BASE_URL);
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when session is not found', async () => {
    jest.mocked(getSession).mockResolvedValue(null);
    const req = makeRequest('GET', BASE_URL);
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});

// ── POST /api/admin/users ─────────────────────────────────────────────────────

describe('POST /api/admin/users', () => {
  const createdUser = buildMockUser({
    _id: new mongoose.Types.ObjectId(),
    username: 'newuser',
    email: 'new@test.com',
    role: 'USER',
  });

  beforeEach(() => {
    jest.spyOn(UserModel, 'create').mockResolvedValue(createdUser as never);
  });

  it('creates a user and returns 201 with { id, username, email, role }', async () => {
    const req = makeRequest('POST', BASE_URL, {
      username: 'newuser',
      email: 'new@test.com',
      password: STRONG_PASSWORD,
      role: 'USER',
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).toMatchObject({ username: 'newuser', email: 'new@test.com', role: 'USER' });
    expect(data).toHaveProperty('id');
  });

  it('does not include passwordHash in 201 response', async () => {
    const req = makeRequest('POST', BASE_URL, {
      username: 'secure',
      email: 'secure@test.com',
      password: STRONG_PASSWORD,
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data).not.toHaveProperty('passwordHash');
  });

  it('calls AuditLogModel.create with action USER_CREATED', async () => {
    const auditCreateSpy = jest.spyOn(AuditLogModel, 'create').mockResolvedValue({} as never);

    const req = makeRequest('POST', BASE_URL, {
      username: 'audited',
      email: 'audited@test.com',
      password: STRONG_PASSWORD,
    });
    await POST(req);

    expect(auditCreateSpy).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_CREATED' }));
  });

  it('returns 400 for invalid email format', async () => {
    const req = makeRequest('POST', BASE_URL, {
      username: 'bademail',
      email: 'not-an-email',
      password: STRONG_PASSWORD,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is missing', async () => {
    const req = makeRequest('POST', BASE_URL, {
      username: 'noemail',
      password: STRONG_PASSWORD,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for password too short', async () => {
    const req = makeRequest('POST', BASE_URL, {
      username: 'shortpass',
      email: 'short@test.com',
      password: 'short',
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain('12');
  });

  it('returns 400 for password missing uppercase', async () => {
    const req = makeRequest('POST', BASE_URL, {
      username: 'nocase',
      email: 'nocase@test.com',
      password: 'nouppercase123!',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for password missing special character', async () => {
    const req = makeRequest('POST', BASE_URL, {
      username: 'nospec',
      email: 'nospec@test.com',
      password: 'NoSpecialChar123',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 409 when username is already taken', async () => {
    jest.spyOn(UserModel, 'findOne').mockImplementation((filter: unknown) => {
      const f = filter as Record<string, unknown>;
      if (f.username === 'taken') return Promise.resolve(buildMockUser()) as never;
      return Promise.resolve(null) as never;
    });

    const req = makeRequest('POST', BASE_URL, {
      username: 'taken',
      email: 'different@test.com',
      password: STRONG_PASSWORD,
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('returns 409 when email is already used', async () => {
    jest.spyOn(UserModel, 'findOne').mockImplementation((filter: unknown) => {
      const f = filter as Record<string, unknown>;
      if (f.email === 'used@test.com') return Promise.resolve(buildMockUser()) as never;
      return Promise.resolve(null) as never;
    });

    const req = makeRequest('POST', BASE_URL, {
      username: 'different',
      email: 'used@test.com',
      password: STRONG_PASSWORD,
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('returns 401 without session cookie', async () => {
    const req = makeUnauthorizedRequest('POST', BASE_URL, {
      username: 'noauth',
      email: 'noauth@test.com',
      password: STRONG_PASSWORD,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 401 when session is expired/not found', async () => {
    jest.mocked(getSession).mockResolvedValue(null);
    const req = makeRequest('POST', BASE_URL, {
      username: 'expired',
      email: 'expired@test.com',
      password: STRONG_PASSWORD,
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
