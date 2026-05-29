import { NextResponse } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import GroupModel from '@models/Group';
import GroupTournamentModel from '@models/GroupTournament';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import TournamentConflictModel from '@models/TournamentConflict';

// Même IDs que /api/test/seed — ce endpoint est appelé juste après
const T_ID = 9_999_901;
const P1_ID = 9_901; // Alice
const P2_ID = 9_902; // Bob

/**
 * POST /api/test/seed/scenarios
 * Construit les données de scénarios groupes/conflits par-dessus le seed de base.
 * Prérequis : /api/test/seed doit avoir été appelé avant.
 */
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectToMongoDB();

  const [player, group] = await Promise.all([
    UserModel.findOne({ username: 'e2e_player' }),
    GroupModel.findOne({ name: 'e2e_group' }),
  ]);

  if (!player || !group) {
    return NextResponse.json(
      { error: 'Seed de base manquant — appelez POST /api/test/seed d\'abord' },
      { status: 400 },
    );
  }

  const groupId = String(group._id);
  const userId = String(player._id);

  // Nettoyage des données de scénarios précédentes
  await Promise.all([
    GroupTournamentModel.deleteMany({ groupId: group._id, tournamentId: T_ID }),
    TournamentPlayersDeckModel.deleteMany({ tournamentId: T_ID }),
    TournamentConflictModel.deleteMany({ tournamentId: T_ID }),
  ]);

  // Rattache le tournoi au groupe
  const groupTournament = await GroupTournamentModel.create({
    groupId: group._id,
    tournamentId: T_ID,
    addedBy: group.createdBy,
    status: 'ACTIVE',
  });

  // Deck de portée groupe : Alice → Ruby+Sapphire, Bob → Emerald+Amber
  const groupDeck = await TournamentPlayersDeckModel.create({
    tournamentId: T_ID,
    groupId: group._id,
    userId: null,
    players: [
      { playerId: P1_ID, best_identifier: 'Alice', event_best_identifier: 'Alice', decks: [['Ruby', 'Sapphire']] },
      { playerId: P2_ID, best_identifier: 'Bob', event_best_identifier: 'Bob', decks: [['Emerald', 'Amber']] },
    ],
  });

  // Deck de portée utilisateur : Alice → Amber+Steel (diverge du groupe)
  const userDeck = await TournamentPlayersDeckModel.create({
    tournamentId: T_ID,
    groupId: null,
    userId: player._id,
    players: [
      { playerId: P1_ID, best_identifier: 'Alice', event_best_identifier: 'Alice', decks: [['Amber', 'Steel']] },
    ],
  });

  // Conflit PENDING — Alice (visible par e2e_player sur la page tournoi)
  const conflictPending = await TournamentConflictModel.create({
    status: 'PENDING',
    userId: player._id,
    groupId: group._id,
    tournamentId: T_ID,
    playerId: P1_ID,
    playerName: 'Alice',
    previousInks: [['Ruby', 'Sapphire']], // version groupe
    proposedInks: [['Amber', 'Steel']],   // version utilisateur
  });

  // Conflit PENDING_ADMIN — Bob (visible par e2e_admin sur la page groupes/tournois)
  const conflictPendingAdmin = await TournamentConflictModel.create({
    status: 'PENDING_ADMIN',
    userId: player._id,
    groupId: group._id,
    tournamentId: T_ID,
    playerId: P2_ID,
    playerName: 'Bob',
    previousInks: [['Emerald', 'Amber']], // version groupe
    proposedInks: [['Steel', 'Ruby']],    // proposition de e2e_player
  });

  return NextResponse.json({
    groupId,
    userId,
    tournamentId: T_ID,
    groupTournamentId: String(groupTournament._id),
    groupDeckId: String(groupDeck._id),
    userDeckId: String(userDeck._id),
    conflictPendingId: String(conflictPending._id),
    conflictPendingAdminId: String(conflictPendingAdmin._id),
  });
}
