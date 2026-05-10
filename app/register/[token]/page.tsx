import { notFound } from 'next/navigation';
import { RegisterForm } from './RegisterForm';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function RegisterPage({ params }: Props) {
  const { token } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/invitations/${token}`,
    { cache: 'no-store' },
  );

  if (res.status === 404) notFound();

  const data = await res.json();

  if (!res.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8 text-center">
          <h1 className="text-lg font-semibold text-foreground mb-2">Invitation invalide</h1>
          <p className="text-sm text-muted-foreground">{data.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <RegisterForm token={token} email={data.email} groups={data.groups} />
    </div>
  );
}
