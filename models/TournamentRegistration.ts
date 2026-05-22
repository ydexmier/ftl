import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRegisteredPlayer {
	registrationId: number;
	playerId: number;
	name: string;
	realName: string;
	registrationStatus: string;
}

export interface ITournamentRegistration extends Document {
	tournamentId: number;
	players: IRegisteredPlayer[];
	totalCount: number;
	lastFetchedAt: Date;
}

const RegisteredPlayerSchema = new Schema<IRegisteredPlayer>(
	{
		registrationId: { type: Number, required: true },
		playerId: { type: Number, required: true },
		name: { type: String, required: true },
		realName: { type: String, required: true },
		registrationStatus: { type: String, required: true },
	},
	{ _id: false },
);

const TournamentRegistrationSchema = new Schema<ITournamentRegistration>(
	{
		tournamentId: { type: Number, required: true, unique: true },
		players: [RegisteredPlayerSchema],
		totalCount: { type: Number, required: true, default: 0 },
		lastFetchedAt: { type: Date, required: true },
	},
	{ timestamps: false },
);

TournamentRegistrationSchema.index({ tournamentId: 1 });

if (process.env.NODE_ENV === 'development') {
	TournamentRegistrationSchema.set('autoIndex', true);
}

const TournamentRegistrationModel: Model<ITournamentRegistration> =
	(mongoose.models.TournamentRegistration as Model<ITournamentRegistration>) ||
	mongoose.model<ITournamentRegistration>('TournamentRegistration', TournamentRegistrationSchema);

export default TournamentRegistrationModel;
