export const INKS = ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'] as const;
export type Ink = (typeof INKS)[number];
export type Deck = Ink[];
