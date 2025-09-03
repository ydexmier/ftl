import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: Number,
  pronouns: String,
  best_identifier: String,
  game_user_profile_picture_url: String
}, { _id: false });

const UserTournamentStatusSchema = new mongoose.Schema({
  id: Number,
  best_identifier: String,
  registration_status: String,
  matches_won: Number,
  matches_lost: Number,
  matches_drawn: Number,
  total_match_points: Number,
  user: UserSchema
}, { _id: false });

const PlayerSchema = new mongoose.Schema({
  id: Number,
  pronouns: String,
  best_identifier: String,
  game_user_profile_picture_url: String
}, { _id: false });

const PlayerMatchRelationshipSchema = new mongoose.Schema({
  player_order: Number,
  player: PlayerSchema,
  user_tournament_status: UserTournamentStatusSchema
}, { _id: false });

const MatchSchema = new mongoose.Schema({
  id: Number,
  created_at: Date,
  updated_at: Date,
  table_number: Number,
  order: Number,
  status: String,
  pod_number: { type: Number, default: null },
  match_is_intentional_draw: Boolean,
  match_is_unintentional_draw: Boolean,
  match_is_bye: Boolean,
  match_is_loss: Boolean,
  reports_are_in_conflict: Boolean,
  games_drawn: { type: Number, default: null },
  games_won_by_winner: { type: Number, default: null },
  games_won_by_loser: { type: Number, default: null },
  is_ghost_match: Boolean,
  is_feature_match: Boolean,
  deck_check_started: Boolean,
  deck_check_completed: Boolean,
  time_extension_seconds: Number,
  team_tournament_match: { type: mongoose.Schema.Types.Mixed, default: null },
  tournament_round: Number,
  reporting_player: { type: mongoose.Schema.Types.Mixed, default: null },
  winning_player: { type: mongoose.Schema.Types.Mixed, default: null },
  assigned_judge: { type: mongoose.Schema.Types.Mixed, default: null },
  players: [Number],
  player_match_relationships: [PlayerMatchRelationshipSchema]
});

// ⚡ configure AVANT de compiler le modèle
if (process.env.NODE_ENV === 'development') {
  MatchSchema.set('autoIndex', true);
}

// ⚡ compile après config
let Match;

try {
  Match = mongoose.model("Match");
} catch {
  Match = mongoose.model("Match", MatchSchema);
}

export default Match;