import { Package } from 'lucide-react';

interface DeckbuildingRoundProps {
	playerCount?: number;
}

export default function DeckbuildingRound({ playerCount }: DeckbuildingRoundProps) {
	return (
		<div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card px-6 py-12 text-center">
			<div className="flex h-14 w-14 items-center justify-center rounded-full bg-background border border-border">
				<Package className="h-7 w-7 text-muted-foreground" />
			</div>
			<div className="flex flex-col gap-1">
				<h3 className="text-base font-semibold text-foreground">Phase de construction de deck</h3>
				<p className="text-sm text-muted-foreground max-w-sm">
					Les joueurs ouvrent leurs boosters et construisent leur deck. Cette phase ne comporte pas de matchs.
				</p>
			</div>
			{playerCount !== undefined && (
				<p className="text-xs text-muted-foreground">
					{playerCount} joueur{playerCount !== 1 ? 's' : ''} en lice
				</p>
			)}
		</div>
	);
}
