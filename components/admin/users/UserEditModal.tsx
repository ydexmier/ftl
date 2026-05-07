'use client';
import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { Alert } from '@components/ui/Alert';
import type { UserRole } from '@models/User';

const ROLE_OPTIONS = [
  { value: 'USER', label: 'USER' },
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'SUPERUSER', label: 'SUPERUSER' },
];

export interface UserForEdit {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
}

interface Props {
  user: UserForEdit;
  onClose: () => void;
  onSuccess: () => void;
}

export function UserEditModal({ user, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ username: user.username, email: user.email, role: user.role, password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const body: Record<string, string> = {
        username: form.username,
        email: form.email,
        role: form.role,
      };
      if (form.password) body.password = form.password;

      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Erreur'); return; }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Modifier <span className="text-muted-foreground font-normal">@{user.username}</span></h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 flex flex-col gap-4">
          {error && <Alert severity="error">{error}</Alert>}

          <Input label="Nom d'utilisateur" value={form.username} onChange={set('username')} required fullWidth />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} required fullWidth />
          <Select label="Rôle" options={ROLE_OPTIONS} value={form.role} onChange={set('role')} fullWidth />

          <div className="border-t border-border pt-4 flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">Laisser vide pour ne pas modifier le mot de passe.</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                  className="w-full h-9 rounded-md border border-white/25 bg-card px-3 pr-10 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {form.password && (
              <Input label="Confirmer" type={showPwd ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} fullWidth autoComplete="new-password" />
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" loading={loading} className="flex-1">Enregistrer</Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
