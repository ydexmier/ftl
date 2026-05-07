import mongoose from 'mongoose';
import { NextRequest } from 'next/server';

export const ADMIN_USER_ID = new mongoose.Types.ObjectId();
export const TARGET_USER_ID = new mongoose.Types.ObjectId();

export const MOCK_SESSION = {
  sessionId: 'mock-session-id',
  userId: ADMIN_USER_ID,
  role: 'ADMIN' as const,
  createdAt: new Date(),
  lastActivityAt: new Date(),
  expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
  ipAddress: '127.0.0.1',
  userAgent: 'jest-test',
};

export function makeRequest(method: string, url: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: 'session=mock-session-token',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function makeUnauthorizedRequest(method: string, url: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}
