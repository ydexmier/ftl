import mongoose from 'mongoose';

export function mockChain<T>(data: T | T[] | null) {
  const chain: Record<string, unknown> & PromiseLike<T | T[] | null> = {
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(data),
    // Thenable so `await findById(id)` resolves to data (not the chain object)
    then: (resolve: (v: T | T[] | null) => unknown, reject?: (r: unknown) => unknown) =>
      Promise.resolve(data).then(resolve, reject),
    catch: (reject: (r: unknown) => unknown) => Promise.resolve(data).catch(reject),
  };
  return chain;
}

export function buildMockUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    username: 'testuser',
    email: 'test@test.com',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function buildMockSession(userId: mongoose.Types.ObjectId, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    sessionId: `session-${Math.random()}`,
    userId,
    role: 'USER',
    expiresAt: new Date(Date.now() + 3600000),
    createdAt: new Date(),
    lastActivityAt: new Date(),
    ipAddress: '127.0.0.1',
    userAgent: 'jest-test',
    ...overrides,
  };
}

export function buildMockAuditLog(userId: mongoose.Types.ObjectId, action: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    action,
    userId,
    username: 'admin',
    ipAddress: '127.0.0.1',
    userAgent: 'jest-test',
    timestamp: new Date(),
    ...overrides,
  };
}
