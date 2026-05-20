import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as forgotPassword } from '../../app/api/auth/forgot-password/route';
import { GET as validateReset, POST as resetPassword } from '../../app/api/auth/reset-password/[token]/route';
import PasswordResetModel from '@models/PasswordReset';
import UserModel from '@models/User';
import { createTestUser, makeRequest, DEFAULT_PASSWORD } from '../test/helpers';
import { sendPasswordResetEmail } from '@/src/lib/email';
import { verifyPassword } from '@/src/lib/auth/password';

function makeForgotRequest(body: unknown, ip: string) {
  return new NextRequest('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

function makeResetRequest(token: string, body: unknown, ip: string) {
  return new NextRequest(`http://localhost:3000/api/auth/reset-password/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/forgot-password', () => {
  it('répond ok même si l\'email est inconnu (pas d\'énumération)', async () => {
    const req = makeRequest('POST', '/api/auth/forgot-password', { email: 'unknown@example.com' });
    const res = await forgotPassword(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.sent).toBe(true);
    // Aucun token créé en BDD
    const count = await PasswordResetModel.countDocuments();
    expect(count).toBe(0);
  });

  it('crée un token et envoie l\'email pour un email connu', async () => {
    await createTestUser({ email: 'known@example.com' });
    const req = makeRequest('POST', '/api/auth/forgot-password', { email: 'known@example.com' });
    const res = await forgotPassword(req);

    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('known@example.com', expect.any(String));

    const reset = await PasswordResetModel.findOne();
    expect(reset).not.toBeNull();
    expect(reset!.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('invalide les anciens tokens avant d\'en créer un nouveau', async () => {
    const user = await createTestUser({ email: 'multi@example.com' });

    // Premier token
    await PasswordResetModel.create({
      userId: user._id,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const req = makeRequest('POST', '/api/auth/forgot-password', { email: 'multi@example.com' });
    await forgotPassword(req);

    const count = await PasswordResetModel.countDocuments({ userId: user._id });
    expect(count).toBe(1);
  });

  it('refuse un email invalide', async () => {
    const req = makeRequest('POST', '/api/auth/forgot-password', { email: 'not-an-email' });
    const res = await forgotPassword(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si le champ email est absent', async () => {
    const req = makeRequest('POST', '/api/auth/forgot-password', {});
    const res = await forgotPassword(req);
    expect(res.status).toBe(400);
  });

  it('retourne 429 après trop de tentatives depuis la même IP', async () => {
    const ip = 'ip-forgot-rate-limit';
    let lastStatus = 200;
    for (let i = 0; i < 10; i++) {
      const req = makeForgotRequest({ email: 'anyone@example.com' }, ip);
      const res = await forgotPassword(req);
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    expect(lastStatus).toBe(429);
  });
});

describe('GET /api/auth/reset-password/[token]', () => {
  it('valide un token valide', async () => {
    const user = await createTestUser();
    const token = crypto.randomUUID();
    await PasswordResetModel.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const req = makeRequest('GET', `/api/auth/reset-password/${token}`);
    const res = await validateReset(req, { params: Promise.resolve({ token }) });

    expect(res.status).toBe(200);
  });

  it('rejette un token expiré', async () => {
    const user = await createTestUser();
    const token = crypto.randomUUID();
    await PasswordResetModel.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() - 1000),
    });

    const req = makeRequest('GET', `/api/auth/reset-password/${token}`);
    const res = await validateReset(req, { params: Promise.resolve({ token }) });
    expect(res.status).toBe(400);
  });

  it('rejette un token déjà utilisé', async () => {
    const user = await createTestUser();
    const token = crypto.randomUUID();
    await PasswordResetModel.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      usedAt: new Date(),
    });

    const req = makeRequest('GET', `/api/auth/reset-password/${token}`);
    const res = await validateReset(req, { params: Promise.resolve({ token }) });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/reset-password/[token]', () => {
  it('réinitialise le mot de passe et invalide le token', async () => {
    const user = await createTestUser();
    const token = crypto.randomUUID();
    await PasswordResetModel.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const req = makeRequest('POST', `/api/auth/reset-password/${token}`, {
      password: 'NewPassword1!',
    });
    const res = await resetPassword(req, { params: Promise.resolve({ token }) });

    expect(res.status).toBe(200);

    const updated = await UserModel.findById(user._id);
    const passwordChanged = await verifyPassword(updated!.passwordHash, 'NewPassword1!');
    expect(passwordChanged).toBe(true);

    const reset = await PasswordResetModel.findOne({ token });
    expect(reset!.usedAt).not.toBeNull();
  });

  it('refuse un token déjà utilisé', async () => {
    const user = await createTestUser();
    const token = crypto.randomUUID();
    await PasswordResetModel.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      usedAt: new Date(),
    });

    const req = makeRequest('POST', `/api/auth/reset-password/${token}`, {
      password: 'NewPassword1!',
    });
    const res = await resetPassword(req, { params: Promise.resolve({ token }) });
    expect(res.status).toBe(400);
  });

  it('refuse un mot de passe trop faible', async () => {
    const user = await createTestUser();
    const token = crypto.randomUUID();
    await PasswordResetModel.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const req = makeRequest('POST', `/api/auth/reset-password/${token}`, { password: 'weak' });
    const res = await resetPassword(req, { params: Promise.resolve({ token }) });
    expect(res.status).toBe(400);

    // Le mot de passe ne doit pas avoir changé
    const unchanged = await UserModel.findById(user._id);
    const stillOld = await verifyPassword(unchanged!.passwordHash, DEFAULT_PASSWORD);
    expect(stillOld).toBe(true);
  });

  it('retourne 429 après trop de tentatives depuis la même IP', async () => {
    const ip = 'ip-reset-rate-limit';
    const token = crypto.randomUUID();
    let lastStatus = 400;
    for (let i = 0; i < 10; i++) {
      const req = makeResetRequest(token, { password: 'NewPassword1!' }, ip);
      const res = await resetPassword(req, { params: Promise.resolve({ token }) });
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    expect(lastStatus).toBe(429);
  });
});
