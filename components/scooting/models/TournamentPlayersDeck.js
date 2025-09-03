import mongoose from 'mongoose';

// Sous-schemas
const PlayerDeckSchema = new mongoose.Schema(
  { inks: [String] },
  { _id: false }
);

const PlayerSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, alias: 'playerId' },
    pronouns: { type: String, default: null },
    best_identifier: String,
    game_user_profile_picture_url: String,
    deck: { type: [PlayerDeckSchema], default: () => ([]) },
    probable_decks: { type: [PlayerDeckSchema], default: [] },
    status: { type: String, default: null }, // deck, probable_decks, null
  },
  { _id: false }
);

// Schema principal
const TournamentPlayersDeckSchema = new mongoose.Schema(
  {
    tournamentId: { type: Number, unique: true },
    players: [PlayerSchema],
  },
  { timestamps: true }
);

// ⚡ autoIndex en dev
if (process.env.NODE_ENV === 'development') {
  TournamentPlayersDeckSchema.set('autoIndex', true);
}

// Compile le modèle (sécurisé pour éviter double compilation)
const TournamentPlayersDeck =
  mongoose.models.TournamentPlayersDeck ||
  mongoose.model('TournamentPlayersDeck', TournamentPlayersDeckSchema);

export default TournamentPlayersDeck;
