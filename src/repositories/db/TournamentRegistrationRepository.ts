import TournamentRegistrationModel, { type IRegisteredPlayer } from '@models/TournamentRegistration';
import connectToMongoDB from '@/src/lib/db';

export const TournamentRegistrationRepository = {
	async findByTournamentId(tournamentId: number) {
		await connectToMongoDB();
		return TournamentRegistrationModel.findOne({ tournamentId }).lean();
	},

	async upsert(tournamentId: number, players: IRegisteredPlayer[], totalCount: number) {
		await connectToMongoDB();
		return TournamentRegistrationModel.findOneAndUpdate(
			{ tournamentId },
			{ tournamentId, players, totalCount, lastFetchedAt: new Date() },
			{ new: true, upsert: true },
		);
	},

	async deleteByTournamentId(tournamentId: number) {
		await connectToMongoDB();
		return TournamentRegistrationModel.deleteOne({ tournamentId });
	},
};
