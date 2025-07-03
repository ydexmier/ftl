import mongoose from 'mongoose';

const UserTournamentStatusSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  matches_won: { type: Number, required: true },
  matches_drawn: { type: Number, required: true },
  matches_lost: { type: Number, required: true },
  total_match_points: { type: Number, required: true },
  full_profile_picture_url: { type: String },
  registration_status: { type: String, required: true },
  best_identifier: { type: String, required: true },
});

const PlayerSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  best_identifier: { type: String, required: true },
});

const RankingEntrySchema = new mongoose.Schema({
  rank: { type: Number, required: true },
  player: { type: PlayerSchema, required: true },
  user_tournament_status: { type: UserTournamentStatusSchema, required: true },
  record: { type: String, required: true },
  match_record: { type: String, required: true },
  match_points: { type: Number, required: true },
  opponent_match_win_percentage: { type: Number, required: true },
  opponent_game_win_percentage: { type: Number, required: true },
});

const RankingSchema = new mongoose.Schema({
  page_size: { type: Number, required: true },
  count: { type: Number, required: true },
  total: { type: Number, required: true },
  current_page_number: { type: Number, required: true },
  next_page_number: { type: Number, default: null },
  next: { type: Number, default: null },
  previous: { type: Number, default: null },
  previous_page_number: { type: Number, default: null },
  results: { type: [RankingEntrySchema], required: true },
});

const Ranking = mongoose.model('Ranking', RankingSchema);

// CRUD functions
export async function find(filter = {}) {
  return Ranking.find(filter).exec();
}

export async function findOne(filter) {
  return Ranking.findOne(filter).exec();
}

export async function findOneAndUpdate(filter, update, options = {}) {
  return Ranking.findOneAndUpdate(filter, update, options).exec();
}

export async function deleteOne(filter) {
  return Ranking.deleteOne(filter).exec();
}
