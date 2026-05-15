import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ITournamentPlayerDeck {
	playerId: number;
	pronouns: string | null;
	best_identifier: string;
	event_best_identifier: string;
	decks: string[][];
}

export interface ITournamentPlayersDeck extends Document {
	tournamentId: number;
	groupId: Types.ObjectId | null;
	userId: Types.ObjectId | null;
	players: ITournamentPlayerDeck[];
	createdAt: Date;
	updatedAt: Date;
}

const PlayerSchema = new Schema<ITournamentPlayerDeck>(
	{
		playerId: { type: Number, required: true },
		pronouns: { type: String, default: null },
		best_identifier: String,
		event_best_identifier: { type: String, default: '' },
		decks: { type: [[String]], default: () => [] },
	},
	{ _id: false },
);

const TournamentPlayersDeckSchema = new Schema<ITournamentPlayersDeck>(
	{
		tournamentId: { type: Number, required: true },
		groupId: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
		userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
		players: [PlayerSchema],
	},
	{ timestamps: true },
);

TournamentPlayersDeckSchema.index({ tournamentId: 1, groupId: 1, userId: 1 });

if (process.env.NODE_ENV === 'development') {
	TournamentPlayersDeckSchema.set('autoIndex', true);
}

const TournamentPlayersDeckModel: Model<ITournamentPlayersDeck> =
	(mongoose.models.TournamentPlayersDeck as Model<ITournamentPlayersDeck>) ||
	mongoose.model<ITournamentPlayersDeck>('TournamentPlayersDeck', TournamentPlayersDeckSchema);

export default TournamentPlayersDeckModel;
