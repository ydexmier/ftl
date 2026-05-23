export const INKS = ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'] as const;
export type Ink = (typeof INKS)[number];
export type Deck = Ink[];

const INK_ORDER: Record<string, number> = {
	Amber: 0,
	Amethyst: 1,
	Emerald: 2,
	Ruby: 3,
	Sapphire: 4,
	Steel: 5,
};

export function isValidInk(value: string): value is Ink {
	return (INKS as readonly string[]).includes(value);
}

export function isBicolor(deck: Deck): boolean {
	return deck.length === 2;
}

export function normalizeInkCombo(inks: string[]): string[] {
	return [...inks].sort((a, b) => (INK_ORDER[a] ?? 99) - (INK_ORDER[b] ?? 99));
}
