'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { Alert } from '@components/ui/Alert';

interface Group {
  _id: string;
  name: string;
}

interface Props {
  token: string;
  email: string;
  groups: Group[];
}

export function RegisterForm({ token, email, groups }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password }),
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
        <h1 className="text-lg font-semibold text-foreground">Compte créé !</h1>
        <p className="text-sm text-muted-foreground">
          Ton compte a été créé avec succès. Un email de confirmation t&apos;a été envoyé.
        </p>
        <Button onClick={() => router.push('/login')}>Se connecter</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Créer ton compte</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Invitation pour <span className="font-mono text-foreground">{email}</span>
        </p>
      </div>

      {groups.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">Tu rejoindras automatiquement :</p>
          <div className="flex flex-wrap gap-1.5">
            {groups.map((g) => (
              <Badge key={g._id} label={g.name} color="info" />
            ))}
          </div>
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        {error && <Alert severity="error">{error}</Alert>}

        <Input
          label="Pseudo"
          value={form.username}
          onChange={set('username')}
          required
          fullWidth
          autoComplete="username"
          placeholder="ton_pseudo"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Mot de passe</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              required
              autoComplete="new-password"
              placeholder="12 caractères minimum"
              className="w-full h-9 rounded-md border border-white/25 bg-card px-3 pr-10 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Minimum 12 caractères, majuscule, minuscule, chiffre et caractère spécial.
          </p>
        </div>

        <Input
          label="Confirmer le mot de passe"
          type={showPwd ? 'text' : 'password'}
          value={form.confirm}
          onChange={set('confirm')}
          required
          fullWidth
          autoComplete="new-password"
        />

        <Button type="submit" loading={loading} className="w-full mt-1">
          Créer mon compte
        </Button>
      </form>
    </div>
  );
}
