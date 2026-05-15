'use client';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Alert } from '@components/ui/Alert';

interface Props {
  initialUsername: string;
  initialEmail: string;
}

export function ProfileClient({ initialUsername, initialEmail }: Props) {
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const submitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email }),
      });
      const data = await res.json();
      if (!res.ok) { setProfileError(data.error ?? 'Erreur'); return; }
      setProfileSuccess('Profil mis à jour.');
    } finally {
      setProfileLoading(false);
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPwdError('Les mots de passe ne correspondent pas'); return; }
    setPwdError('');
    setPwdSuccess('');
    setPwdLoading(true);
    try {
      const res = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPwdError(data.error ?? 'Erreur'); return; }
      setPwdSuccess('Mot de passe modifié.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-foreground">Mon profil</h1>

      {/* Informations */}
      <section className="bg-card border border-border rounded-xl p-4 sm:p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">Informations</h2>

        {profileError && <Alert severity="error">{profileError}</Alert>}
        {profileSuccess && <Alert severity="success">{profileSuccess}</Alert>}

        <form onSubmit={submitProfile} className="flex flex-col gap-4">
          <Input
            label="Pseudo"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            fullWidth
            autoComplete="username"
          />
          <Input
            label="Adresse email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
          />
          <Button type="submit" loading={profileLoading} className="w-full sm:w-auto sm:self-start">
            Enregistrer
          </Button>
        </form>
      </section>

      {/* Mot de passe */}
      <section className="bg-card border border-border rounded-xl p-4 sm:p-6 flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">Modifier le mot de passe</h2>

        {pwdError && <Alert severity="error">{pwdError}</Alert>}
        {pwdSuccess && <Alert severity="success">{pwdSuccess}</Alert>}

        <form onSubmit={submitPassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full h-9 rounded-md border border-white/25 bg-card px-3 pr-10 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Nouveau mot de passe</label>
            <input
              type={showPwd ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="12 caractères minimum"
              className="w-full h-9 rounded-md border border-white/25 bg-card px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            <p className="text-xs text-muted-foreground">Minimum 12 caractères, majuscule, minuscule, chiffre et caractère spécial.</p>
          </div>

          <Input
            label="Confirmer le nouveau mot de passe"
            type={showPwd ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
          />

          <Button type="submit" loading={pwdLoading} className="w-full sm:w-auto sm:self-start">
            Modifier le mot de passe
          </Button>
        </form>
      </section>
    </div>
  );
}
