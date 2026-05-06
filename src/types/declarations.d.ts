declare module '*.css';

declare module '@models/Tournament.js' {
	import type { Model } from 'mongoose';
	const Tournament: Model<Record<string, unknown>>;
	export default Tournament;
}

declare module '@models/Round.js' {
	import type { Model } from 'mongoose';
	const Round: Model<Record<string, unknown>>;
	export default Round;
}

declare module '@models/TournamentPlayersDeck.js' {
	import type { Model } from 'mongoose';
	const TournamentPlayersDeck: Model<Record<string, unknown>>;
	export default TournamentPlayersDeck;
}

declare module '@models/Ranking.mjs' {
	import type { Model } from 'mongoose';
	const Ranking: Model<Record<string, unknown>>;
	export default Ranking;
}
