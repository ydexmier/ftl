export const INKS = ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'] as const;
export type Ink = (typeof INKS)[number];
export type Deck = Ink[];

export function isValidInk(value: string): value is Ink {
	return (INKS as readonly string[]).includes(value);
}

export function isBicolor(deck: Deck): boolean {
	return deck.length === 2;
}
