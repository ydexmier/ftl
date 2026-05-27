'use client';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Copy, Check, Key } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Spinner } from '@components/ui/Spinner';

interface ApiToken {
  _id: string;
  name: string;
  status: 'ACTIVE' | 'REVOKED';
  expiresAt: string;
  lastUsedAt: string | null;
  createdAt: string;
}

interface CreatedToken {
  token: ApiToken;
  rawToken: string;
}

interface Props {
  groupId: string;
  tournamentId: number;
}

export function ApiTokensTab({ groupId, tournamentId }: Props) {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [createdToken, setCreatedToken] = useState<CreatedToken | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = `/api/groups/${groupId}/tournaments/${tournamentId}/api-tokens`;

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(baseUrl);
      if (!res.ok) throw new Error('Erreur lors du chargement');
      setTokens(await res.json());
    } catch {
      setError('Impossible de charger les tokens');
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  async function handleCreate(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Erreur lors de la création');
      }
      const data = await res.json();
      setCreatedToken(data);
      setNewName('');
      setShowForm(false);
      setTokens(prev => [data.token, ...prev]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(tokenId: string) {
    setRevoking(tokenId);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/${tokenId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur lors de la révocation');
      setTokens(prev => prev.filter(t => t._id !== tokenId));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRevoking(null);
    }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const activeTokens = tokens.filter(t => t.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Accès API externe</h2>
          <p className="text-sm text-zinc-400 mt-0.5">
            Permettez à des entités externes (sites, bots) de lire les decks et commentaires de ce tournoi.
          </p>
        </div>
        {!showForm && (
          <Button variant="default" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Créer un token
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-4 space-y-3">
          <p className="text-sm font-medium text-white">Nouveau token d&apos;accès</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nom de l'entité (ex : Discord Bot, Site streaming...)"
              maxLength={100}
              className="flex-1 bg-zinc-900 border border-zinc-600 rounded-md px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <Button type="submit" variant="default" size="sm" disabled={creating || !newName.trim()}>
              {creating ? <Spinner size="sm" /> : 'Créer'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setNewName(''); }}>
              Annuler
            </Button>
          </div>
        </form>
      )}

      {createdToken && (
        <div className="bg-amber-950/40 border border-amber-700/60 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Key className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-300">Token créé — copiez-le maintenant</p>
              <p className="text-xs text-amber-500 mt-0.5">
                Ce token ne sera plus affiché après avoir fermé cette fenêtre.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2">
            <code className="flex-1 text-xs text-green-400 font-mono truncate">{createdToken.rawToken}</code>
            <button
              onClick={() => handleCopy(createdToken.rawToken)}
              className="shrink-0 text-zinc-400 hover:text-white transition-colors"
              title="Copier"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Utilisez ce token avec : <code className="text-zinc-300">Authorization: Bearer &lt;token&gt;</code>
          </p>
          <Button variant="ghost" size="sm" onClick={() => setCreatedToken(null)}>
            Fermer
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : activeTokens.length === 0 ? (
        <div className="text-center py-10 text-zinc-500 text-sm">
          Aucun token actif. Créez-en un pour ouvrir l&apos;accès API.
        </div>
      ) : (
        <div className="border border-zinc-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700 bg-zinc-800/40">
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Nom</th>
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Expire le</th>
                <th className="text-left px-4 py-2.5 text-zinc-400 font-medium">Dernière utilisation</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {activeTokens.map((token, i) => (
                <tr key={token._id} className={i < activeTokens.length - 1 ? 'border-b border-zinc-700/50' : ''}>
                  <td className="px-4 py-3 text-white font-medium">{token.name}</td>
                  <td className="px-4 py-3 text-zinc-300">{formatDate(token.expiresAt)}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {token.lastUsedAt ? formatDate(token.lastUsedAt) : 'Jamais'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRevoke(token._id)}
                      disabled={revoking === token._id}
                      className="text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      title="Révoquer ce token"
                    >
                      {revoking === token._id ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
