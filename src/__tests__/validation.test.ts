import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  validateLoginBody,
  validateRegisterBody,
  validateForgotPasswordBody,
  validateResetPasswordBody,
  validateAccessRequestBody,
  validateAdminUserCreate,
  validateAdminUserUpdate,
  validateAdminGroupBody,
  validateAdminInvitationEmails,
} from '@/src/lib/validation';

// ─── isValidEmail ─────────────────────────────────────────────────────────────

describe('isValidEmail', () => {
  it('accepte un email valide', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user+tag@sub.domain.org')).toBe(true);
  });

  it('rejette les emails invalides', () => {
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('noatsign')).toBe(false);
    expect(isValidEmail('missing@')).toBe(false);
  });
});

// ─── validateLoginBody ────────────────────────────────────────────────────────

describe('validateLoginBody', () => {
  it('rejette un body vide', () => {
    const r = validateLoginBody({});
    expect(r.ok).toBe(false);
  });

  it('rejette un username manquant', () => {
    const r = validateLoginBody({ password: 'pass' });
    expect(r.ok).toBe(false);
  });

  it('rejette un mot de passe manquant', () => {
    const r = validateLoginBody({ username: 'alice' });
    expect(r.ok).toBe(false);
  });

  it('normalise le username en minuscules', () => {
    const r = validateLoginBody({ username: 'Alice', password: 'secret' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.username).toBe('alice');
  });
});

// ─── validateRegisterBody ─────────────────────────────────────────────────────

describe('validateRegisterBody', () => {
  it('rejette un pseudo vide', () => {
    expect(validateRegisterBody({ username: '', password: 'pass' }).ok).toBe(false);
  });

  it('rejette un pseudo trop long (>30)', () => {
    const r = validateRegisterBody({ username: 'a'.repeat(31), password: 'pass' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('30');
  });

  it('rejette sans mot de passe', () => {
    expect(validateRegisterBody({ username: 'alice' }).ok).toBe(false);
  });

  it('retourne ok avec des valeurs valides', () => {
    const r = validateRegisterBody({ username: 'Alice', password: 'secret' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.username).toBe('Alice');
  });
});

// ─── validateForgotPasswordBody ───────────────────────────────────────────────

describe('validateForgotPasswordBody', () => {
  it('rejette un email manquant', () => {
    expect(validateForgotPasswordBody({}).ok).toBe(false);
  });

  it('rejette un email invalide', () => {
    const r = validateForgotPasswordBody({ email: 'notanemail' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('Email invalide');
  });

  it('retourne ok avec un email valide (normalisé en minuscules)', () => {
    const r = validateForgotPasswordBody({ email: 'User@Example.COM' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.email).toBe('user@example.com');
  });
});

// ─── validateResetPasswordBody ────────────────────────────────────────────────

describe('validateResetPasswordBody', () => {
  it('rejette sans mot de passe', () => {
    expect(validateResetPasswordBody({}).ok).toBe(false);
  });

  it('retourne ok avec un mot de passe', () => {
    const r = validateResetPasswordBody({ password: 'newpass' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.password).toBe('newpass');
  });
});

// ─── validateAccessRequestBody ───────────────────────────────────────────────

describe('validateAccessRequestBody', () => {
  it('rejette un email manquant', () => {
    expect(validateAccessRequestBody({ captchaToken: 'tok' }).ok).toBe(false);
  });

  it('rejette un email invalide', () => {
    const r = validateAccessRequestBody({ email: 'bad', captchaToken: 'tok' });
    expect(r.ok).toBe(false);
  });

  it('rejette sans captchaToken', () => {
    expect(validateAccessRequestBody({ email: 'a@b.com' }).ok).toBe(false);
  });

  it('retourne ok et ignore une reason vide', () => {
    const r = validateAccessRequestBody({ email: 'a@b.com', captchaToken: 'tok', reason: '  ' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.reason).toBeUndefined();
  });

  it('retourne ok avec une reason non vide', () => {
    const r = validateAccessRequestBody({ email: 'a@b.com', captchaToken: 'tok', reason: 'raison' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.reason).toBe('raison');
  });
});

// ─── validateAdminUserCreate ──────────────────────────────────────────────────

describe('validateAdminUserCreate', () => {
  it('rejette un pseudo manquant', () => {
    expect(validateAdminUserCreate({ email: 'a@b.com', password: 'pass' }).ok).toBe(false);
  });

  it('rejette un pseudo trop long', () => {
    const r = validateAdminUserCreate({ username: 'a'.repeat(31), email: 'a@b.com', password: 'pass' });
    expect(r.ok).toBe(false);
  });

  it('rejette un email manquant', () => {
    expect(validateAdminUserCreate({ username: 'alice', password: 'pass' }).ok).toBe(false);
  });

  it('rejette un email invalide', () => {
    const r = validateAdminUserCreate({ username: 'alice', email: 'notvalid', password: 'pass' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('invalide');
  });

  it('rejette sans mot de passe', () => {
    expect(validateAdminUserCreate({ username: 'alice', email: 'a@b.com' }).ok).toBe(false);
  });

  it('utilise le rôle USER par défaut si rôle absent ou invalide', () => {
    const r = validateAdminUserCreate({ username: 'alice', email: 'a@b.com', password: 'pass' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.role).toBe('USER');
  });

  it('accepte un rôle valide ADMIN', () => {
    const r = validateAdminUserCreate({ username: 'alice', email: 'a@b.com', password: 'pass', role: 'ADMIN' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.role).toBe('ADMIN');
  });

  it('normalise le username en minuscules', () => {
    const r = validateAdminUserCreate({ username: 'Alice', email: 'a@b.com', password: 'pass' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.username).toBe('alice');
  });
});

// ─── validateAdminUserUpdate ──────────────────────────────────────────────────

describe('validateAdminUserUpdate', () => {
  it('rejette un body vide (aucun champ à mettre à jour)', () => {
    const r = validateAdminUserUpdate({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('Aucun champ');
  });

  it('rejette un username invalide (vide après trim)', () => {
    expect(validateAdminUserUpdate({ username: '   ' }).ok).toBe(false);
  });

  it('rejette un username trop long', () => {
    expect(validateAdminUserUpdate({ username: 'a'.repeat(31) }).ok).toBe(false);
  });

  it('rejette un email invalide', () => {
    expect(validateAdminUserUpdate({ email: 'notvalid' }).ok).toBe(false);
  });

  it('rejette un email non-string', () => {
    expect(validateAdminUserUpdate({ email: 123 }).ok).toBe(false);
  });

  it('rejette un rôle invalide', () => {
    expect(validateAdminUserUpdate({ role: 'SUPERADMIN' }).ok).toBe(false);
  });

  it('rejette un mot de passe non-string', () => {
    expect(validateAdminUserUpdate({ password: 42 }).ok).toBe(false);
  });

  it('accepte une mise à jour de username valide', () => {
    const r = validateAdminUserUpdate({ username: 'NewName' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.username).toBe('newname');
  });

  it('accepte une mise à jour de email valide', () => {
    const r = validateAdminUserUpdate({ email: 'New@Example.COM' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.email).toBe('new@example.com');
  });

  it('accepte une mise à jour de rôle valide', () => {
    const r = validateAdminUserUpdate({ role: 'ADMIN' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.role).toBe('ADMIN');
  });

  it('accepte une mise à jour de mot de passe', () => {
    const r = validateAdminUserUpdate({ password: 'newpass' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.password).toBe('newpass');
  });

  it('accepte plusieurs champs simultanément', () => {
    const r = validateAdminUserUpdate({ username: 'alice', role: 'SUPERUSER', password: 'p' });
    expect(r.ok).toBe(true);
  });
});

// ─── validateAdminGroupBody ───────────────────────────────────────────────────

describe('validateAdminGroupBody', () => {
  it('rejette un nom vide', () => {
    expect(validateAdminGroupBody({ name: '', description: '' }).ok).toBe(false);
  });

  it('rejette un nom trop long (>100)', () => {
    const r = validateAdminGroupBody({ name: 'a'.repeat(101), description: '' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('100');
  });

  it('rejette une description trop longue (>500)', () => {
    const r = validateAdminGroupBody({ name: 'Groupe', description: 'a'.repeat(501) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('500');
  });

  it('retourne ok avec des valeurs valides', () => {
    const r = validateAdminGroupBody({ name: '  Mon groupe  ', description: 'Une desc' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.name).toBe('Mon groupe');
      expect(r.data.description).toBe('Une desc');
    }
  });

  it('utilise une description vide si absente', () => {
    const r = validateAdminGroupBody({ name: 'G', description: undefined });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.description).toBe('');
  });
});

// ─── validateAdminInvitationEmails ───────────────────────────────────────────

describe('validateAdminInvitationEmails', () => {
  it('rejette si emails est absent ou vide', () => {
    expect(validateAdminInvitationEmails({}).ok).toBe(false);
    expect(validateAdminInvitationEmails({ emails: [] }).ok).toBe(false);
  });

  it('rejette si plus de 100 emails', () => {
    const r = validateAdminInvitationEmails({ emails: Array.from({ length: 101 }, (_, i) => `u${i}@test.com`) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('100');
  });

  it('retourne ok avec une liste valide sans groupIds', () => {
    const r = validateAdminInvitationEmails({ emails: ['a@b.com', 'c@d.com'] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.emails).toHaveLength(2);
      expect(r.data.groupIds).toEqual([]);
    }
  });

  it('filtre les groupIds non-strings', () => {
    const r = validateAdminInvitationEmails({ emails: ['a@b.com'], groupIds: ['id1', 42, 'id2'] });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.groupIds).toEqual(['id1', 'id2']);
  });
});
