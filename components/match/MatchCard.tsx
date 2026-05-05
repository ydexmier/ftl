import { Badge } from '@components/ui/Badge';
import Ink from '@components/ui/Ink';
import { getStatusFromMatch, showScoreFromMatch } from '@/src/domain/rules/matchRules';
import type { Match, MatchStatusResult } from '@/src/types/match';

type InkDeck = string[];
type InkCombination = InkDeck[];

interface MatchCardProps {
	match: Match;
	player1Deck?: InkCombination;
	player2Deck?: InkCombination | false;
	onClick?: () => void;
	className?: string;
}

const DeckDisplay = ({ playerId, decks }: { playerId: number; decks: InkCombination }) => (
	<div className="flex flex-wrap gap-2 justify-center">
		{decks?.map((deck, deckIndex) => (
			<div key={`${playerId}_${deckIndex}`} className="flex items-center gap-1">
				{deckIndex > 0 && <span className="text-xs text-muted-foreground">OU</span>}
				<div className="flex">
					{deck.map((ink) => <Ink key={`${playerId}_${ink}`} type={ink} width={40} />)}
					{deck.length === 1 && <Ink type="" width={40} />}
				</div>
			</div>
		))}
	</div>
);

const MatchCard = ({ match, player1Deck, player2Deck, onClick, className }: MatchCardProps) => {
	const status: MatchStatusResult = getStatusFromMatch(match);
	const player1 = match.player_match_relationships.find(
		(p) => p.player_order === 1 || match.match_is_bye || match.match_is_loss,
	);
	const player2 = player2Deck
		? match.player_match_relationships.find((p) => p.player_order === 2)
		: null;

	return (
		<div
			onClick={onClick}
			className={[
				'flex flex-col rounded-xl border border-border bg-card overflow-hidden',
				onClick ? 'cursor-pointer hover:shadow-lg hover:shadow-black/30 transition-shadow' : '',
				className ?? '',
			].join(' ')}
		>
			<div className="px-4 pt-4 pb-2 flex items-center justify-between">
				<Badge label={`Table ${match.table_number}`} />
				<Badge color={status.color} size="sm" label={status.label} />
			</div>

			<hr className="border-border mx-4" />

			<div className="px-4 py-3 flex flex-col gap-2">
				{/* Player 1 */}
				<div className="flex items-center justify-between gap-2">
					<span className="font-semibold text-sm text-foreground truncate">
						{player1?.player.best_identifier}
					</span>
					<Badge variant="outline" label={player1?.user_event_status.best_identifier ?? ''} size="sm" />
				</div>
				{player1Deck && (
					<DeckDisplay playerId={player1?.player.id ?? 0} decks={player1Deck} />
				)}
			</div>

			{/* Score / BYE */}
			<div className="flex items-center gap-2 px-4 py-1">
				<hr className="flex-1 border-border" />
				<span className="text-xs font-medium text-muted-foreground shrink-0">
					{player2 ? showScoreFromMatch(match) : 'BYE'}
				</span>
				<hr className="flex-1 border-border" />
			</div>

			{/* Player 2 */}
			{player2 && (
				<div className="px-4 py-3 flex flex-col gap-2">
					<div className="flex items-center justify-between gap-2">
						<span className="font-semibold text-sm text-foreground truncate">
							{player2.player.best_identifier}
						</span>
						<Badge variant="outline" label={player2.user_event_status.best_identifier} size="sm" />
					</div>
					{player2Deck && (
						<DeckDisplay playerId={player2.player.id} decks={player2Deck as InkCombination} />
					)}
				</div>
			)}
		</div>
	);
};

export default MatchCard;
