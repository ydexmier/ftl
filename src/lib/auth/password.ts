import argon2 from 'argon2';

const ARGON2_OPTIONS = { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 };

export async function hashPassword(p: string) { return argon2.hash(p, ARGON2_OPTIONS); }
export async function verifyPassword(hash: string, p: string) { return argon2.verify(hash, p); }

export function validatePasswordStrength(p: string): { valid: boolean; message?: string } {
  if (p.length < 12) return { valid: false, message: 'Minimum 12 caracteres.' };
  if (!/[A-Z]/.test(p)) return { valid: false, message: 'Une majuscule requise.' };
  if (!/[a-z]/.test(p)) return { valid: false, message: 'Une minuscule requise.' };
  if (!/[0-9]/.test(p)) return { valid: false, message: 'Un chiffre requis.' };
  if (!/[^A-Za-z0-9]/.test(p)) return { valid: false, message: 'Un caractere special requis.' };
  return { valid: true };
}
