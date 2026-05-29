import { NextResponse } from 'next/server';
import connectToMongoDB from '@/src/lib/db';
import UserModel from '@models/User';
import TournamentModel from '@models/Tournament';
import RoundModel from '@models/Round';
import GroupModel from '@models/Group';
import TournamentExternalAccessModel from '@models/TournamentExternalAccess';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import SessionModel from '@models/Session';
import { hashPassword } from '@/src/lib/auth/password';
import { v4 as uuidv4 } from 'uuid';

// IDs fixes pour les données E2E — hors plage des tournois réels Ravensburger
const T_ID = 9_999_901;
const R_ID = 9_999_901;
const P1_ID = 9_901;
const P2_ID = 9_902;
const M_ID = 99_901;
const E2E_PASSWORD = 'E2ePassword1!';

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectToMongoDB();

  // Nettoyage des données E2E précédentes
  await Promise.all([
    UserModel.deleteMany({ username: { $in: ['e2e_player', 'e2e_admin'] } }),
    GroupModel.deleteMany({ name: 'e2e_group' }),
    TournamentModel.deleteMany({ id: T_ID }),
    RoundModel.deleteMany({ id: R_ID }),
    TournamentExternalAccessModel.deleteMany({ tournamentId: T_ID }),
    TournamentPlayersDeckModel.deleteMany({ tournamentId: T_ID }),
    SessionModel.deleteMany({}),
  ]);

  const passwordHash = await hashPassword(E2E_PASSWORD);

  const [player, admin] = await Promise.all([
    UserModel.create({
      username: 'e2e_player',
      email: 'e2e_player@test.local',
      passwordHash,
      role: 'USER',
      onboardingCompletedAt: new Date(),
    }),
    UserModel.create({
      username: 'e2e_admin',
      email: 'e2e_admin@test.local',
      passwordHash,
      role: 'ADMIN',
      onboardingCompletedAt: new Date(),
    }),
  ]);

  const group = await GroupModel.create({
    name: 'e2e_group',
    description: 'Groupe de test E2E',
    createdBy: admin._id,
    members: [
      { userId: admin._id, role: 'ADMIN', joinedAt: new Date(), invitedBy: admin._id },
      { userId: player._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id },
    ],
  });

  await TournamentModel.create({
    id: T_ID,
    name: 'E2E Test Tournament',
    event_status: 'ENDED',
    start_datetime: new Date('2025-01-01'),
    gameplay_format: { id: 'constructed', name: 'Constructed', description: '' },
    tournament_phases: [
      {
        id: 1,
        first_round_type: null,
        status: 'ENDED',
        order_in_phases: 1,
        number_of_rounds: 1,
        round_type: 'SWISS',
        rank_required_to_enter_phase: null,
        rounds: [
          {
            id: R_ID,
            round_number: 1,
            final_round_in_event: true,
            pairings_status: 'PUBLISHED',
            standings_status: 'PUBLISHED',
            round_type: 'SWISS',
            status: 'COMPLETE',
          },
        ],
      },
    ],
  });

  await RoundModel.create({
    id: R_ID,
    tournamentId: T_ID,
    results: [
      {
        id: M_ID,
        table_number: 1,
        order: 1,
        status: 'COMPLETE',
        pod_number: null,
        match_is_intentional_draw: false,
        match_is_unintentional_draw: false,
        match_is_bye: false,
        match_is_loss: false,
        reports_are_in_conflict: false,
        games_drawn: null,
        games_won_by_winner: 2,
        games_won_by_loser: 0,
        is_ghost_match: false,
        is_feature_match: false,
        deck_check_started: false,
        deck_check_completed: false,
        time_extension_seconds: 0,
        tournament_round: 1,
        winning_player: P1_ID,
        reporting_player: null,
        assigned_judge: null,
        team_event_match: null,
        players: [P1_ID, P2_ID],
        player_match_relationships: [
          {
            player_order: 1,
            player: {
              id: P1_ID,
              best_identifier: 'Alice',
              pronouns: null,
              game_user_profile_picture_url: null,
            },
            user_event_status: {
              id: P1_ID,
              best_identifier: 'Alice',
              registration_status: 'CHECKED_IN',
              matches_won: 1,
              matches_lost: 0,
              matches_drawn: 0,
              total_match_points: 3,
            },
          },
          {
            player_order: 2,
            player: {
              id: P2_ID,
              best_identifier: 'Bob',
              pronouns: null,
              game_user_profile_picture_url: null,
            },
            user_event_status: {
              id: P2_ID,
              best_identifier: 'Bob',
              registration_status: 'CHECKED_IN',
              matches_won: 0,
              matches_lost: 1,
              matches_drawn: 0,
              total_match_points: 0,
            },
          },
        ],
      },
    ],
    lastFetchedAt: new Date(),
  });

  const guestToken = uuidv4();
  const externalAccess = await TournamentExternalAccessModel.create({
    groupId: group._id,
    tournamentId: T_ID,
    invitedBy: admin._id,
    email: 'guest@test.local',
    displayName: null,
    accessToken: guestToken,
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  return NextResponse.json({
    password: E2E_PASSWORD,
    player: { id: String(player._id), username: player.username },
    admin: { id: String(admin._id), username: admin.username },
    tournament: { id: T_ID },
    round: { id: R_ID },
    matchId: M_ID,
    group: { id: String(group._id) },
    guestToken,
    guestAccessId: String(externalAccess._id),
  });
}
