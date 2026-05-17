import { describe, it, expect } from 'vitest';
import { isValidInk, isBicolor } from '@/src/domain/value-objects/Ink';
import type { Ink } from '@/src/domain/value-objects/Ink';

describe('isValidInk', () => {
  it('retourne true pour une encre valide', () => {
    expect(isValidInk('Amber')).toBe(true);
    expect(isValidInk('Amethyst')).toBe(true);
    expect(isValidInk('Emerald')).toBe(true);
    expect(isValidInk('Ruby')).toBe(true);
    expect(isValidInk('Sapphire')).toBe(true);
    expect(isValidInk('Steel')).toBe(true);
  });

  it('retourne false pour une encre inconnue', () => {
    expect(isValidInk('InvalidColor')).toBe(false);
  });

  it('retourne false pour une chaîne vide', () => {
    expect(isValidInk('')).toBe(false);
  });

  it('est sensible à la casse', () => {
    expect(isValidInk('amber')).toBe(false);
    expect(isValidInk('AMBER')).toBe(false);
  });
});

describe('isBicolor', () => {
  it('retourne true pour un deck à 2 encres', () => {
    expect(isBicolor(['Amber', 'Ruby'] as Ink[])).toBe(true);
  });

  it('retourne false pour un deck à 1 encre', () => {
    expect(isBicolor(['Amber'] as Ink[])).toBe(false);
  });

  it('retourne false pour un deck vide', () => {
    expect(isBicolor([])).toBe(false);
  });

  it('retourne false pour un deck à 3 encres', () => {
    expect(isBicolor(['Amber', 'Ruby', 'Emerald'] as Ink[])).toBe(false);
  });
});
