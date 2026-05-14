'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Alert } from '@components/ui/Alert';

export default function AccessRequestPage() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const captchaRef = useRef<HCaptcha>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!captchaToken) {
      setError('Veuillez compléter la vérification anti-robot');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason, captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue');
        captchaRef.current?.resetCaptcha();
        setCaptchaToken('');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY ?? '';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="text-center flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">Demande d&apos;accès</h1>
          <p className="text-sm text-muted-foreground">
            Remplissez ce formulaire pour demander un compte.
          </p>
        </div>

        {success ? (
          <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4 text-center">
            <p className="text-foreground font-medium">Demande envoyée !</p>
            <p className="text-sm text-muted-foreground">
              Votre demande a bien été reçue. Un administrateur l&apos;examinera prochainement.
            </p>
            <Link href="/login" className="text-sm text-primary hover:underline">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4">
            {error && <Alert severity="error">{error}</Alert>}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Adresse email <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Raison de la demande{' '}
                <span className="text-muted-foreground font-normal">(optionnel)</span>
              </label>
              <textarea
                placeholder="Pourquoi souhaitez-vous accéder à l'application ?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-white/25 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex justify-center">
              <HCaptcha
                ref={captchaRef}
                sitekey={siteKey}
                onVerify={setCaptchaToken}
                onExpire={() => setCaptchaToken('')}
                theme="dark"
              />
            </div>

            <Button type="submit" loading={loading} disabled={!captchaToken} className="w-full">
              Envoyer la demande
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
