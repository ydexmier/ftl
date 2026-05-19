import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import PlayerCommentModel from '@models/PlayerComment';
import { PlayerCommentRepository } from '@/src/repositories/db/PlayerCommentRepository';
import { createTestUser, createTestGroup } from '../test/helpers';

async function makeComment(overrides: Partial<{
  tournamentId: number;
  playerId: number;
  authorId: string;
  groupId: string | null;
  inks: string[];
  content: string;
}> = {}) {
  const user = await createTestUser({ username: `u-${Date.now()}-${Math.random().toString(36).slice(2)}`, email: `${Math.random().toString(36).slice(2)}@test.com` });
  return PlayerCommentRepository.create({
    tournamentId: overrides.tournamentId ?? 1,
    playerId: overrides.playerId ?? 10,
    authorId: overrides.authorId ?? String(user._id),
    groupId: overrides.groupId ?? null,
    inks: overrides.inks ?? ['Amber', 'Amethyst'],
    content: overrides.content ?? 'Joue ambre/améthyste depuis le début.',
  });
}

// ─── create ──────────────────────────────────────────────────────────────────

describe('PlayerCommentRepository.create', () => {
  it('crée un commentaire avec tous les champs', async () => {
    const user = await createTestUser({ username: 'u1', email: 'u1@test.com' });
    const group = await createTestGroup(user._id);

    const comment = await PlayerCommentRepository.create({
      tournamentId: 42,
      playerId: 7,
      authorId: String(user._id),
      groupId: String(group._id),
      inks: ['Steel', 'Ruby'],
      content: 'Deck agressif.',
    });

    expect(comment.tournamentId).toBe(42);
    expect(comment.playerId).toBe(7);
    expect(comment.inks).toEqual(['Steel', 'Ruby']);
    expect(comment.content).toBe('Deck agressif.');
    expect(String(comment.groupId)).toBe(String(group._id));
  });

  it('refuse un contenu supérieur à 500 caractères', async () => {
    const user = await createTestUser({ username: 'u2', email: 'u2@test.com' });
    await expect(
      PlayerCommentRepository.create({
        tournamentId: 1,
        playerId: 1,
        authorId: String(user._id),
        groupId: null,
        inks: ['Amber'],
        content: 'a'.repeat(501),
      }),
    ).rejects.toThrow();
  });
});

// ─── findByPlayer ─────────────────────────────────────────────────────────────

describe('PlayerCommentRepository.findByPlayer', () => {
  it('retourne les commentaires dans le bon scope (groupe)', async () => {
    const user = await createTestUser({ username: 'u3', email: 'u3@test.com' });
    const group = await createTestGroup(user._id);
    const groupId = String(group._id);

    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 5, authorId: String(user._id), groupId, inks: ['Amber'], content: 'Commentaire groupe' });
    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 5, authorId: String(user._id), groupId: null, inks: ['Amber'], content: 'Commentaire perso' });

    const groupComments = await PlayerCommentRepository.findByPlayer(1, 5, { groupId });
    expect(groupComments).toHaveLength(1);
    expect(groupComments[0].content).toBe('Commentaire groupe');

    const personalComments = await PlayerCommentRepository.findByPlayer(1, 5, { groupId: null });
    expect(personalComments).toHaveLength(1);
    expect(personalComments[0].content).toBe('Commentaire perso');
  });

  it('trie par createdAt décroissant', async () => {
    const user = await createTestUser({ username: 'u4', email: 'u4@test.com' });
    const authorId = String(user._id);

    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 5, authorId, groupId: null, inks: ['Amber'], content: 'Premier' });
    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 5, authorId, groupId: null, inks: ['Ruby'], content: 'Deuxième' });

    const comments = await PlayerCommentRepository.findByPlayer(1, 5, { groupId: null });
    expect(comments[0].content).toBe('Deuxième');
    expect(comments[1].content).toBe('Premier');
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('PlayerCommentRepository.update', () => {
  it('met à jour le contenu', async () => {
    const c = await makeComment({ content: 'Ancien contenu' });
    const updated = await PlayerCommentRepository.update(String(c._id), 'Nouveau contenu');
    expect(updated?.content).toBe('Nouveau contenu');
  });
});

// ─── delete ──────────────────────────────────────────────────────────────────

describe('PlayerCommentRepository.delete', () => {
  it('supprime le commentaire', async () => {
    const c = await makeComment();
    await PlayerCommentRepository.delete(String(c._id));
    const found = await PlayerCommentModel.findById(c._id);
    expect(found).toBeNull();
  });
});

// ─── migrateToGroup ──────────────────────────────────────────────────────────

describe('PlayerCommentRepository.migrateToGroup', () => {
  it('migre les commentaires perso vers la portée groupe', async () => {
    const user = await createTestUser({ username: 'u5', email: 'u5@test.com' });
    const group = await createTestGroup(user._id);
    const authorId = String(user._id);
    const groupId = String(group._id);

    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 10, authorId, groupId: null, inks: ['Amber'], content: 'Perso A' });
    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 11, authorId, groupId: null, inks: ['Ruby'], content: 'Perso B' });

    await PlayerCommentRepository.migrateToGroup(1, [10, 11], authorId, groupId);

    const perso = await PlayerCommentModel.find({ groupId: null, authorId: new mongoose.Types.ObjectId(authorId) });
    expect(perso).toHaveLength(0);

    const groupe = await PlayerCommentModel.find({ groupId: new mongoose.Types.ObjectId(groupId) });
    expect(groupe).toHaveLength(2);
  });

  it('ne migre pas les commentaires des autres joueurs', async () => {
    const user = await createTestUser({ username: 'u6', email: 'u6@test.com' });
    const group = await createTestGroup(user._id);
    const authorId = String(user._id);
    const groupId = String(group._id);

    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 10, authorId, groupId: null, inks: ['Amber'], content: 'Joueur 10' });
    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 99, authorId, groupId: null, inks: ['Steel'], content: 'Joueur 99 non ciblé' });

    await PlayerCommentRepository.migrateToGroup(1, [10], authorId, groupId);

    const restant = await PlayerCommentModel.findOne({ playerId: 99, groupId: null });
    expect(restant).not.toBeNull();
  });
});

// ─── deleteForPlayerAndUser ───────────────────────────────────────────────────

describe('PlayerCommentRepository.deleteForPlayerAndUser', () => {
  it('supprime uniquement les commentaires perso de cet auteur pour ce joueur', async () => {
    const user = await createTestUser({ username: 'u7', email: 'u7@test.com' });
    const user2 = await createTestUser({ username: 'u8', email: 'u8@test.com' });
    const authorId = String(user._id);

    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 10, authorId, groupId: null, inks: ['Amber'], content: 'À supprimer' });
    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 10, authorId: String(user2._id), groupId: null, inks: ['Ruby'], content: 'Autre auteur, à conserver' });

    await PlayerCommentRepository.deleteForPlayerAndUser(1, 10, authorId);

    const remaining = await PlayerCommentModel.find({ tournamentId: 1, playerId: 10 });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].content).toBe('Autre auteur, à conserver');
  });
});

// ─── deleteForPlayerAndGroup ─────────────────────────────────────────────────

describe('PlayerCommentRepository.deleteForPlayerAndGroup', () => {
  it('supprime tous les commentaires groupe pour ce joueur', async () => {
    const user = await createTestUser({ username: 'u9', email: 'u9@test.com' });
    const group = await createTestGroup(user._id);
    const groupId = String(group._id);

    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 10, authorId: String(user._id), groupId, inks: ['Amber'], content: 'Groupe A' });
    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 10, authorId: String(user._id), groupId: null, inks: ['Amber'], content: 'Perso, à conserver' });

    await PlayerCommentRepository.deleteForPlayerAndGroup(1, 10, groupId);

    const remaining = await PlayerCommentModel.find({ tournamentId: 1, playerId: 10 });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].content).toBe('Perso, à conserver');
  });
});

// ─── countByPlayers ──────────────────────────────────────────────────────────

describe('PlayerCommentRepository.countByPlayers', () => {
  it('retourne le compte par playerId dans le bon scope', async () => {
    const user = await createTestUser({ username: 'u10', email: 'u10@test.com' });
    const group = await createTestGroup(user._id);
    const authorId = String(user._id);
    const groupId = String(group._id);

    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 10, authorId, groupId, inks: ['Amber'], content: 'C1' });
    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 10, authorId, groupId, inks: ['Ruby'], content: 'C2' });
    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 11, authorId, groupId, inks: ['Steel'], content: 'C3' });
    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 10, authorId, groupId: null, inks: ['Amber'], content: 'Perso, hors scope' });

    const counts = await PlayerCommentRepository.countByPlayers(1, [10, 11, 12], { groupId });
    expect(counts[10]).toBe(2);
    expect(counts[11]).toBe(1);
    expect(counts[12]).toBeUndefined();
  });
});
