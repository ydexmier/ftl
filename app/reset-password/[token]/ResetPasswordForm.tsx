'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Alert } from '@components/ui/Alert';

interface Props {
  token: string;
}

export function ResetPasswordForm({ token }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur'); return; }
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8 text-center flex flex-col gap-4">
        <div className="w-12 h-12 rounded-full bg-green-900/40 flex items-center justify-center mx-auto">
          <span className="text-green-400 text-xl">✓</span>
        </div>
        <h1 className="text-lg font-semibold text-foreground">Mot de passe modifié</h1>
        <p className="text-sm text-muted-foreground">Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
        <Button onClick={() => router.push('/login')}>Se connecter</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8 flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Nouveau mot de passe</h1>
        <p className="text-sm text-muted-foreground mt-1">Choisis un mot de passe sécurisé.</p>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Nouveau mot de passe</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="12 caractères minimum"
              className="w-full h-9 rounded-md border border-white/25 bg-card px-3 pr-10 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Minimum 12 caractères, majuscule, minuscule, chiffre et caractère spécial.</p>
        </div>

        <Input
          label="Confirmer le mot de passe"
          type={showPwd ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          fullWidth
          autoComplete="new-password"
        />

        <Button type="submit" loading={loading} className="w-full mt-1">
          Enregistrer le mot de passe
        </Button>
      </form>
    </div>
  );
}
