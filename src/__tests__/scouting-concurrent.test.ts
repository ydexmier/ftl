import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import TournamentPlayersDeckModel from '@models/TournamentPlayersDeck';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import type { Deck } from '@/src/types/ink';

let _counter = 0;
function nextTid() { return 750000 + ++_counter; }
function newOid() { return new mongoose.Types.ObjectId().toString(); }

// ─── TournamentPlayersDeckRepository.assignDecks — atomicité ─────────────────

describe('assignDecks — opérations atomiques', () => {
  it('crée le document si inexistant et ajoute le joueur', async () => {
    const tid = nextTid();
    const groupId = newOid();

    await TournamentPlayersDeckRepository.assignDecks(
      tid,
      [{ playerId: 1, bestIdentifier: 'Alice', eventBestIdentifier: 'alice', decks: [['Amber', 'Ruby']] }],
      { groupId, userId: null },
    );

    const doc = await TournamentPlayersDeckModel.findOne({ tournamentId: tid }).lean();
    expect(doc).not.toBeNull();
    const player = doc!.players.find((p) => p.playerId === 1);
    expect(player).toBeDefined();
    expect(player!.decks).toEqual([['Amber', 'Ruby']]);
  });

  it('met à jour les decks d\'un joueur déjà présent', async () => {
    const tid = nextTid();
    const groupId = newOid();
    const scope = { groupId, userId: null };

    await TournamentPlayersDeckRepository.assignDecks(
      tid,
      [{ playerId: 1, bestIdentifier: 'Alice', eventBestIdentifier: 'alice', decks: [['Amber', 'Ruby']] }],
      scope,
    );
    await TournamentPlayersDeckRepository.assignDecks(
      tid,
      [{ playerId: 1, bestIdentifier: 'Alice', eventBestIdentifier: 'alice', decks: [['Sapphire', 'Steel']] }],
      scope,
    );

    const doc = await TournamentPlayersDeckModel.findOne({ tournamentId: tid }).lean();
    const player = doc!.players.find((p) => p.playerId === 1);
    expect(player!.decks).toEqual([['Sapphire', 'Steel']]);
    // Un seul joueur dans le document
    expect(doc!.players.filter((p) => p.playerId === 1)).toHaveLength(1);
  });

  it('retire le joueur du document si decks vides', async () => {
    const tid = nextTid();
    const groupId = newOid();
    const scope = { groupId, userId: null };

    await TournamentPlayersDeckRepository.assignDecks(
      tid,
      [{ playerId: 1, bestIdentifier: 'Alice', eventBestIdentifier: 'alice', decks: [['Amber', 'Ruby']] }],
      scope,
    );
    await TournamentPlayersDeckRepository.assignDecks(
      tid,
      [{ playerId: 1, bestIdentifier: 'Alice', eventBestIdentifier: 'alice', decks: [] }],
      scope,
    );

    const doc = await TournamentPlayersDeckModel.findOne({ tournamentId: tid }).lean();
    expect(doc!.players.find((p) => p.playerId === 1)).toBeUndefined();
  });

  it('normalise l\'ordre des encres à l\'écriture', async () => {
    const tid = nextTid();
    const groupId = newOid();

    await TournamentPlayersDeckRepository.assignDecks(
      tid,
      [{ playerId: 1, bestIdentifier: 'Alice', eventBestIdentifier: 'alice', decks: [['Ruby', 'Amber']] }],
      { groupId, userId: null },
    );

    const doc = await TournamentPlayersDeckModel.findOne({ tournamentId: tid }).lean();
    // Amber doit précéder Ruby dans l'ordre canonique
    expect(doc!.players[0].decks).toEqual([['Amber', 'Ruby']]);
  });

  it('n\'affecte pas les autres joueurs du document lors d\'une mise à jour', async () => {
    const tid = nextTid();
    const groupId = newOid();
    const scope = { groupId, userId: null };

    // Deux joueurs initiaux
    await TournamentPlayersDeckRepository.assignDecks(
      tid,
      [
        { playerId: 1, bestIdentifier: 'Alice', eventBestIdentifier: 'alice', decks: [['Amber', 'Ruby']] },
        { playerId: 2, bestIdentifier: 'Bob', eventBestIdentifier: 'bob', decks: [['Sapphire', 'Steel']] },
      ],
      scope,
    );

    // Mise à jour d'Alice uniquement
    await TournamentPlayersDeckRepository.assignDecks(
      tid,
      [{ playerId: 1, bestIdentifier: 'Alice', eventBestIdentifier: 'alice', decks: [['Emerald', 'Ruby']] }],
      scope,
    );

    const doc = await TournamentPlayersDeckModel.findOne({ tournamentId: tid }).lean();
    expect(doc!.players.find((p) => p.playerId === 1)!.decks).toEqual([['Emerald', 'Ruby']]);
    // Bob doit être inchangé
    expect(doc!.players.find((p) => p.playerId === 2)!.decks).toEqual([['Sapphire', 'Steel']]);
  });

  it('deux assignations simultanées sur des joueurs différents préservent les deux (race condition)', async () => {
    const tid = nextTid();
    const groupId = newOid();
    const scope = { groupId, userId: null };

    await Promise.all([
      TournamentPlayersDeckRepository.assignDecks(
        tid,
        [{ playerId: 1, bestIdentifier: 'Alice', eventBestIdentifier: 'alice', decks: [['Amber', 'Ruby']] }],
        scope,
      ),
      TournamentPlayersDeckRepository.assignDecks(
        tid,
        [{ playerId: 2, bestIdentifier: 'Bob', eventBestIdentifier: 'bob', decks: [['Sapphire', 'Steel']] }],
        scope,
      ),
    ]);

    const doc = await TournamentPlayersDeckModel.findOne({ tournamentId: tid }).lean();
    expect(doc!.players).toHaveLength(2);
    expect(doc!.players.find((p) => p.playerId === 1)!.decks).toEqual([['Amber', 'Ruby']]);
    expect(doc!.players.find((p) => p.playerId === 2)!.decks).toEqual([['Sapphire', 'Steel']]);
  });

  it('cinq assignations simultanées sur cinq joueurs différents — aucune perte', async () => {
    const tid = nextTid();
    const groupId = newOid();
    const scope = { groupId, userId: null };

    const players = [
      { playerId: 1, bestIdentifier: 'P1', eventBestIdentifier: 'p1', decks: [['Amber', 'Ruby']] as Deck[] },
      { playerId: 2, bestIdentifier: 'P2', eventBestIdentifier: 'p2', decks: [['Sapphire', 'Steel']] as Deck[] },
      { playerId: 3, bestIdentifier: 'P3', eventBestIdentifier: 'p3', decks: [['Emerald', 'Ruby']] as Deck[] },
      { playerId: 4, bestIdentifier: 'P4', eventBestIdentifier: 'p4', decks: [['Amber', 'Steel']] as Deck[] },
      { playerId: 5, bestIdentifier: 'P5', eventBestIdentifier: 'p5', decks: [['Amethyst', 'Emerald']] as Deck[] },
    ];

    await Promise.all(
      players.map((p) => TournamentPlayersDeckRepository.assignDecks(tid, [p], scope)),
    );

    const doc = await TournamentPlayersDeckModel.findOne({ tournamentId: tid }).lean();
    expect(doc!.players).toHaveLength(5);
    for (const p of players) {
      const found = doc!.players.find((dp) => dp.playerId === p.playerId);
      expect(found).toBeDefined();
      expect(found!.decks.length).toBeGreaterThan(0);
    }
  });

  it('deux modifications simultanées du même joueur — aucune corruption des autres joueurs', async () => {
    const tid = nextTid();
    const groupId = newOid();
    const scope = { groupId, userId: null };

    // Pré-charger un document avec Alice et Bob
    await TournamentPlayersDeckRepository.assignDecks(
      tid,
      [
        { playerId: 1, bestIdentifier: 'Alice', eventBestIdentifier: 'alice', decks: [['Amber', 'Ruby']] },
        { playerId: 2, bestIdentifier: 'Bob', eventBestIdentifier: 'bob', decks: [['Sapphire', 'Steel']] },
      ],
      scope,
    );

    // Deux updates concurrents sur Alice
    await Promise.all([
      TournamentPlayersDeckRepository.assignDecks(
        tid,
        [{ playerId: 1, bestIdentifier: 'Alice', eventBestIdentifier: 'alice', decks: [['Emerald', 'Ruby']] }],
        scope,
      ),
      TournamentPlayersDeckRepository.assignDecks(
        tid,
        [{ playerId: 1, bestIdentifier: 'Alice', eventBestIdentifier: 'alice', decks: [['Amber', 'Steel']] }],
        scope,
      ),
    ]);

    const doc = await TournamentPlayersDeckModel.findOne({ tournamentId: tid }).lean();
    // Alice doit avoir l'un des deux decks — pas de doublon, pas de corruption
    const alicePlayers = doc!.players.filter((p) => p.playerId === 1);
    expect(alicePlayers).toHaveLength(1);
    expect(alicePlayers[0].decks.length).toBeGreaterThan(0);
    // Bob doit être intact
    expect(doc!.players.find((p) => p.playerId === 2)!.decks).toEqual([['Sapphire', 'Steel']]);
    // Pas de doublon d'Alice
    expect(doc!.players.filter((p) => p.playerId === 1)).toHaveLength(1);
  });
});
