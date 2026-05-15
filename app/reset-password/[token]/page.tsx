import { notFound } from 'next/navigation';
import { PasswordResetRepository } from '@/src/repositories/db/PasswordResetRepository';
import { ResetPasswordForm } from './ResetPasswordForm';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({ params }: Props) {
  const { token } = await params;

  const reset = await PasswordResetRepository.findByToken(token);

  if (!reset) notFound();

  const isInvalid = !!reset.usedAt;
  const isExpired = reset.expiresAt < new Date();

  if (isInvalid || isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8 text-center flex flex-col gap-3">
          <h1 className="text-lg font-semibold text-foreground">Lien invalide</h1>
          <p className="text-sm text-muted-foreground">
            {isExpired ? 'Ce lien a expiré' : 'Lien invalide ou déjà utilisé'}
          </p>
          <a href="/forgot-password" className="text-sm text-primary hover:underline">
            Demander un nouveau lien
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <ResetPasswordForm token={token} />
    </div>
  );
}
