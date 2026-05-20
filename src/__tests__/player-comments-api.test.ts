import { describe, it, expect } from 'vitest';
import { GET as getComments, POST as postComment } from '../../app/api/tournaments/[id]/players/[playerId]/comments/route';
import { PUT as putComment, DELETE as deleteComment } from '../../app/api/player-comments/[commentId]/route';
import { PlayerCommentRepository } from '@/src/repositories/db/PlayerCommentRepository';
import { createTestUser, createAdminUser, createAuthCookie, createTestGroup, makeRequest } from '../test/helpers';

function tournamentCommentsRequest(
  tournamentId: number,
  playerId: number,
  groupId?: string,
  cookie?: string,
) {
  const url = `/api/tournaments/${tournamentId}/players/${playerId}/comments${groupId ? `?groupId=${groupId}` : ''}`;
  return makeRequest('GET', url, undefined, cookie);
}

function commentParams(commentId: string) {
  return { params: Promise.resolve({ commentId }) };
}

function playerParams(id: number, playerId: number) {
  return { params: Promise.resolve({ id: String(id), playerId: String(playerId) }) };
}

// ─── GET /api/tournaments/[id]/players/[playerId]/comments ────────────────────

describe('GET /api/tournaments/:id/players/:playerId/comments', () => {
  it('retourne 401 si non authentifié', async () => {
    const req = tournamentCommentsRequest(1, 10);
    const res = await getComments(req, playerParams(1, 10));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si non-membre demande les commentaires groupe', async () => {
    const owner = await createTestUser({ username: 'owner', email: 'owner@test.com' });
    const group = await createTestGroup(owner._id);
    const nonMember = await createTestUser({ username: 'nonmember', email: 'nm@test.com' });
    const cookie = await createAuthCookie(nonMember._id, 'USER');

    const req = tournamentCommentsRequest(1, 10, String(group._id), cookie);
    const res = await getComments(req, playerParams(1, 10));
    expect(res.status).toBe(403);
  });

  it('retourne les commentaires personnels (pas de groupId)', async () => {
    const user = await createTestUser({ username: 'u1', email: 'u1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const userId = String(user._id);

    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 10, authorId: userId, groupId: null, inks: ['Amber'], content: 'Ma note perso' });

    const req = tournamentCommentsRequest(1, 10, undefined, cookie);
    const res = await getComments(req, playerParams(1, 10));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comments).toHaveLength(1);
    expect(data.comments[0].content).toBe('Ma note perso');
  });

  it('retourne les commentaires groupe si membre', async () => {
    const admin = await createTestUser({ username: 'ga', email: 'ga@test.com' });
    const group = await createTestGroup(admin._id);
    const member = await createTestUser({ username: 'mb', email: 'mb@test.com' });
    // Ajout du membre au groupe
    await import('@models/Group').then((m) =>
      m.default.findByIdAndUpdate(group._id, {
        $push: { members: { userId: member._id, role: 'MEMBER', joinedAt: new Date(), invitedBy: admin._id } },
      }),
    );
    const cookie = await createAuthCookie(member._id, 'USER');
    const groupId = String(group._id);

    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 10, authorId: String(admin._id), groupId, inks: ['Steel'], content: 'Note groupe' });

    const req = tournamentCommentsRequest(1, 10, groupId, cookie);
    const res = await getComments(req, playerParams(1, 10));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comments).toHaveLength(1);
    expect(data.comments[0].content).toBe('Note groupe');
  });
});

// ─── POST /api/tournaments/[id]/players/[playerId]/comments ──────────────────

describe('POST /api/tournaments/:id/players/:playerId/comments', () => {
  it('retourne 401 si non authentifié', async () => {
    const req = makeRequest('POST', '/api/tournaments/1/players/10/comments', { content: 'Hello' });
    const res = await postComment(req, playerParams(1, 10));
    expect(res.status).toBe(401);
  });

  it('retourne 400 pour un tournamentId non numérique', async () => {
    const user = await createTestUser({ username: 'pc-post-1', email: 'pc-post-1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/tournaments/abc/players/10/comments', { content: 'Hello' }, cookie);
    const res = await postComment(req, { params: Promise.resolve({ id: 'abc', playerId: '10' }) });
    expect(res.status).toBe(400);
  });

  it('retourne 400 si le contenu est vide', async () => {
    const user = await createTestUser({ username: 'pc-post-2', email: 'pc-post-2@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/tournaments/1/players/10/comments', { content: '   ' }, cookie);
    const res = await postComment(req, playerParams(1, 10));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si le contenu dépasse 500 caractères', async () => {
    const user = await createTestUser({ username: 'pc-post-3', email: 'pc-post-3@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('POST', '/api/tournaments/1/players/10/comments', { content: 'a'.repeat(501) }, cookie);
    const res = await postComment(req, playerParams(1, 10));
    expect(res.status).toBe(400);
  });

  it('crée un commentaire personnel (sans groupId)', async () => {
    const user = await createTestUser({ username: 'pc-post-4', email: 'pc-post-4@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');

    const req = makeRequest('POST', '/api/tournaments/5/players/20/comments', { content: 'Note perso', inks: ['Amber'] }, cookie);
    const res = await postComment(req, playerParams(5, 20));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.comment.content).toBe('Note perso');
    expect(data.comment.inks).toEqual(['Amber']);
  });

  it('crée un commentaire de groupe si l\'utilisateur est membre', async () => {
    const owner = await createTestUser({ username: 'pc-post-5', email: 'pc-post-5@test.com' });
    const group = await createTestGroup(owner._id);
    const cookie = await createAuthCookie(owner._id, 'USER');
    const groupId = String(group._id);

    const req = makeRequest('POST', '/api/tournaments/6/players/21/comments', { content: 'Note groupe', groupId }, cookie);
    const res = await postComment(req, playerParams(6, 21));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.comment.content).toBe('Note groupe');
  });

  it('retourne 403 si l\'utilisateur n\'est pas membre du groupe (ni accès externe)', async () => {
    const owner = await createTestUser({ username: 'pc-post-6', email: 'pc-post-6@test.com' });
    const outsider = await createTestUser({ username: 'pc-post-7', email: 'pc-post-7@test.com' });
    const group = await createTestGroup(owner._id);
    const cookie = await createAuthCookie(outsider._id, 'USER');
    const groupId = String(group._id);

    const req = makeRequest('POST', '/api/tournaments/7/players/22/comments', { content: 'Interdit', groupId }, cookie);
    const res = await postComment(req, playerParams(7, 22));
    expect(res.status).toBe(403);
  });
});

// ─── GET — cas supplémentaires ────────────────────────────────────────────────

describe('GET /api/tournaments/:id/players/:playerId/comments — cas supplémentaires', () => {
  it('retourne 400 pour des paramètres non numériques', async () => {
    const user = await createTestUser({ username: 'pc-inv-1', email: 'pc-inv-1@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const req = makeRequest('GET', '/api/tournaments/abc/players/xyz/comments', undefined, cookie);
    const res = await getComments(req, { params: Promise.resolve({ id: 'abc', playerId: 'xyz' }) });
    expect(res.status).toBe(400);
  });

  it('un ADMIN peut accéder aux commentaires groupe même sans être membre', async () => {
    const owner = await createTestUser({ username: 'pc-adm-own', email: 'pc-adm-own@test.com' });
    const admin = await createAdminUser({ username: 'pc-adm-sys', email: 'pc-adm-sys@test.com' });
    const group = await createTestGroup(owner._id);
    const cookie = await createAuthCookie(admin._id, 'ADMIN');
    const groupId = String(group._id);

    await PlayerCommentRepository.create({ tournamentId: 1, playerId: 30, authorId: String(owner._id), groupId, inks: ['Ruby'], content: 'Admin access' });

    const req = tournamentCommentsRequest(1, 30, groupId, cookie);
    const res = await getComments(req, playerParams(1, 30));
    expect(res.status).toBe(200);
  });

  it('retourne les commentaires groupComments + memberComments avec targetUserId (vue admin groupe)', async () => {
    const groupAdmin = await createTestUser({ username: 'pc-gadm-1', email: 'pc-gadm-1@test.com' });
    const member = await createTestUser({ username: 'pc-gmem-1', email: 'pc-gmem-1@test.com' });
    const group = await createTestGroup(groupAdmin._id);
    const groupId = String(group._id);
    const cookie = await createAuthCookie(groupAdmin._id, 'USER');

    // Commentaire de groupe du membre
    await PlayerCommentRepository.create({ tournamentId: 8, playerId: 40, authorId: String(member._id), groupId, inks: ['Steel'], content: 'Note groupe membre' });
    // Commentaire perso du membre
    await PlayerCommentRepository.create({ tournamentId: 8, playerId: 40, authorId: String(member._id), groupId: null, inks: ['Amber'], content: 'Note perso membre' });

    const url = `/api/tournaments/8/players/40/comments?groupId=${groupId}&userId=${member._id}`;
    const req = makeRequest('GET', url, undefined, cookie);
    const res = await getComments(req, playerParams(8, 40));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comments).toHaveProperty('groupComments');
    expect(data.comments).toHaveProperty('memberComments');
  });
});

// ─── PUT /api/player-comments/[commentId] ────────────────────────────────────

describe('PUT /api/player-comments/:commentId', () => {
  it('retourne 401 si non authentifié', async () => {
    const req = makeRequest('PUT', '/api/player-comments/abc', { content: 'Nouveau' });
    const res = await putComment(req, commentParams('abc'));
    expect(res.status).toBe(401);
  });

  it('retourne 404 si commentaire inexistant', async () => {
    const user = await createTestUser({ username: 'u2', email: 'u2@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const fakeId = '507f1f77bcf86cd799439011';
    const req = makeRequest('PUT', `/api/player-comments/${fakeId}`, { content: 'X' }, cookie);
    const res = await putComment(req, commentParams(fakeId));
    expect(res.status).toBe(404);
  });

  it('retourne 403 si non auteur et non admin', async () => {
    const author = await createTestUser({ username: 'auth', email: 'auth@test.com' });
    const other = await createTestUser({ username: 'other', email: 'other@test.com' });
    const cookie = await createAuthCookie(other._id, 'USER');

    const comment = await PlayerCommentRepository.create({ tournamentId: 1, playerId: 5, authorId: String(author._id), groupId: null, inks: ['Amber'], content: 'Original' });

    const req = makeRequest('PUT', `/api/player-comments/${comment._id}`, { content: 'Modifié' }, cookie);
    const res = await putComment(req, commentParams(String(comment._id)));
    expect(res.status).toBe(403);
  });

  it("permet à l'auteur de modifier son commentaire", async () => {
    const user = await createTestUser({ username: 'u3', email: 'u3@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');

    const comment = await PlayerCommentRepository.create({ tournamentId: 1, playerId: 5, authorId: String(user._id), groupId: null, inks: ['Amber'], content: 'Original' });

    const req = makeRequest('PUT', `/api/player-comments/${comment._id}`, { content: 'Modifié' }, cookie);
    const res = await putComment(req, commentParams(String(comment._id)));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comment.content).toBe('Modifié');
  });

  it("permet à l'admin du groupe de modifier un commentaire de son groupe", async () => {
    const groupAdmin = await createTestUser({ username: 'ga2', email: 'ga2@test.com' });
    const member = await createTestUser({ username: 'mem', email: 'mem@test.com' });
    const group = await createTestGroup(groupAdmin._id);
    const groupId = String(group._id);
    const cookie = await createAuthCookie(groupAdmin._id, 'USER');

    const comment = await PlayerCommentRepository.create({ tournamentId: 1, playerId: 5, authorId: String(member._id), groupId, inks: ['Ruby'], content: 'Note membre' });

    const req = makeRequest('PUT', `/api/player-comments/${comment._id}`, { content: 'Corrigée' }, cookie);
    const res = await putComment(req, commentParams(String(comment._id)));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comment.content).toBe('Corrigée');
  });

  it('retourne 400 si le contenu dépasse 500 caractères', async () => {
    const user = await createTestUser({ username: 'u4', email: 'u4@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const comment = await PlayerCommentRepository.create({ tournamentId: 1, playerId: 5, authorId: String(user._id), groupId: null, inks: ['Amber'], content: 'Ok' });

    const req = makeRequest('PUT', `/api/player-comments/${comment._id}`, { content: 'a'.repeat(501) }, cookie);
    const res = await putComment(req, commentParams(String(comment._id)));
    expect(res.status).toBe(400);
  });

  it('retourne 400 si le contenu est vide (espaces uniquement)', async () => {
    const user = await createTestUser({ username: 'u4b', email: 'u4b@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const comment = await PlayerCommentRepository.create({ tournamentId: 1, playerId: 5, authorId: String(user._id), groupId: null, inks: ['Amber'], content: 'Original' });

    const req = makeRequest('PUT', `/api/player-comments/${comment._id}`, { content: '   ' }, cookie);
    const res = await putComment(req, commentParams(String(comment._id)));
    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/player-comments/[commentId] ─────────────────────────────────

describe('DELETE /api/player-comments/:commentId', () => {
  it('retourne 401 si non authentifié', async () => {
    const req = makeRequest('DELETE', '/api/player-comments/abc');
    const res = await deleteComment(req, commentParams('abc'));
    expect(res.status).toBe(401);
  });

  it('retourne 403 si non auteur', async () => {
    const author = await createTestUser({ username: 'auth2', email: 'auth2@test.com' });
    const other = await createTestUser({ username: 'other2', email: 'other2@test.com' });
    const cookie = await createAuthCookie(other._id, 'USER');

    const comment = await PlayerCommentRepository.create({ tournamentId: 1, playerId: 5, authorId: String(author._id), groupId: null, inks: ['Amber'], content: 'A supprimer' });

    const req = makeRequest('DELETE', `/api/player-comments/${comment._id}`, undefined, cookie);
    const res = await deleteComment(req, commentParams(String(comment._id)));
    expect(res.status).toBe(403);
  });

  it("supprime le commentaire de l'auteur", async () => {
    const user = await createTestUser({ username: 'u5', email: 'u5@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');

    const comment = await PlayerCommentRepository.create({ tournamentId: 1, playerId: 5, authorId: String(user._id), groupId: null, inks: ['Amber'], content: 'À supprimer' });

    const req = makeRequest('DELETE', `/api/player-comments/${comment._id}`, undefined, cookie);
    const res = await deleteComment(req, commentParams(String(comment._id)));
    expect(res.status).toBe(204);

    const found = await PlayerCommentRepository.findById(String(comment._id));
    expect(found).toBeNull();
  });

  it("permet à l'admin du groupe de supprimer un commentaire du groupe", async () => {
    const groupAdmin = await createTestUser({ username: 'ga3', email: 'ga3@test.com' });
    const member = await createTestUser({ username: 'mem2', email: 'mem2@test.com' });
    const group = await createTestGroup(groupAdmin._id);
    const groupId = String(group._id);
    const cookie = await createAuthCookie(groupAdmin._id, 'USER');

    const comment = await PlayerCommentRepository.create({ tournamentId: 1, playerId: 5, authorId: String(member._id), groupId, inks: ['Ruby'], content: 'Note' });

    const req = makeRequest('DELETE', `/api/player-comments/${comment._id}`, undefined, cookie);
    const res = await deleteComment(req, commentParams(String(comment._id)));
    expect(res.status).toBe(204);
  });

  it('retourne 404 si commentaire inexistant', async () => {
    const user = await createTestUser({ username: 'u6', email: 'u6@test.com' });
    const cookie = await createAuthCookie(user._id, 'USER');
    const fakeId = '507f1f77bcf86cd799439011';

    const req = makeRequest('DELETE', `/api/player-comments/${fakeId}`, undefined, cookie);
    const res = await deleteComment(req, commentParams(fakeId));
    expect(res.status).toBe(404);
  });
});
