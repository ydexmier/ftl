import { notFound } from 'next/navigation';
import { ResetPasswordForm } from './ResetPasswordForm';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({ params }: Props) {
  const { token } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/auth/reset-password/${token}`,
    { cache: 'no-store' },
  );

  if (res.status === 404) notFound();

  const data = await res.json();

  if (!res.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8 text-center flex flex-col gap-3">
          <h1 className="text-lg font-semibold text-foreground">Lien invalide</h1>
          <p className="text-sm text-muted-foreground">{data.error}</p>
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
