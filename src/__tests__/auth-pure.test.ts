import { describe, it, expect } from 'vitest';
import { validatePasswordStrength } from '@/src/lib/auth/password';
import { hasRole } from '@/src/lib/auth/rbac';
import type { UserRole } from '@models/User';

describe('validatePasswordStrength', () => {
  it('rejette un mot de passe trop court (< 12 caractères)', () => {
    const result = validatePasswordStrength('Abc1!');
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/12/);
  });

  it('rejette un mot de passe sans majuscule', () => {
    const result = validatePasswordStrength('abcdefghij1!');
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/majuscule/i);
  });

  it('rejette un mot de passe sans minuscule', () => {
    const result = validatePasswordStrength('ABCDEFGHIJ1!');
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/minuscule/i);
  });

  it('rejette un mot de passe sans chiffre', () => {
    const result = validatePasswordStrength('AbcdefghijkL!');
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/chiffre/i);
  });

  it('rejette un mot de passe sans caractère spécial', () => {
    const result = validatePasswordStrength('Abcdefghij12');
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/special/i);
  });

  it('accepte un mot de passe conforme', () => {
    const result = validatePasswordStrength('StrongPass1!');
    expect(result.valid).toBe(true);
    expect(result.message).toBeUndefined();
  });

  it('accepte un mot de passe long avec tous les critères', () => {
    const result = validatePasswordStrength('Tr0ub4dor&3SecurePassphrase');
    expect(result.valid).toBe(true);
  });
});

describe('hasRole', () => {
  it('USER n\'a pas le rôle ADMIN', () => {
    expect(hasRole('USER' as UserRole, 'ADMIN' as UserRole)).toBe(false);
  });

  it('USER n\'a pas le rôle SUPERUSER', () => {
    expect(hasRole('USER' as UserRole, 'SUPERUSER' as UserRole)).toBe(false);
  });

  it('ADMIN a le rôle ADMIN', () => {
    expect(hasRole('ADMIN' as UserRole, 'ADMIN' as UserRole)).toBe(true);
  });

  it('ADMIN a le rôle USER', () => {
    expect(hasRole('ADMIN' as UserRole, 'USER' as UserRole)).toBe(true);
  });

  it('ADMIN n\'a pas le rôle SUPERUSER', () => {
    expect(hasRole('ADMIN' as UserRole, 'SUPERUSER' as UserRole)).toBe(false);
  });

  it('SUPERUSER a le rôle ADMIN', () => {
    expect(hasRole('SUPERUSER' as UserRole, 'ADMIN' as UserRole)).toBe(true);
  });

  it('SUPERUSER a le rôle USER', () => {
    expect(hasRole('SUPERUSER' as UserRole, 'USER' as UserRole)).toBe(true);
  });

  it('SUPERUSER a le rôle SUPERUSER', () => {
    expect(hasRole('SUPERUSER' as UserRole, 'SUPERUSER' as UserRole)).toBe(true);
  });
});
