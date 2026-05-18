import { notFound } from 'next/navigation';
import { RegisterForm } from './RegisterForm';
import { InvitationRepository } from '@/src/repositories/db/InvitationRepository';
import connectToMongoDB from '@/src/lib/db';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function RegisterPage({ params }: Props) {
  const { token } = await params;

  await connectToMongoDB();
  const invitation = await InvitationRepository.findByTokenWithGroups(token);

  if (!invitation) notFound();

  if (invitation.status !== 'PENDING') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8 text-center">
          <h1 className="text-lg font-semibold text-foreground mb-2">Invitation invalide</h1>
          <p className="text-sm text-muted-foreground">Cette invitation a déjà été utilisée ou annulée</p>
        </div>
      </div>
    );
  }

  if (invitation.expiresAt < new Date()) {
    await InvitationRepository.markExpired(String(invitation._id));
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8 text-center">
          <h1 className="text-lg font-semibold text-foreground mb-2">Invitation expirée</h1>
          <p className="text-sm text-muted-foreground">Cette invitation a expiré</p>
        </div>
      </div>
    );
  }

  const groups = (invitation.groupIds as unknown as Array<{ _id: { toString(): string }; name: string }>).map((g) => ({
    _id: g._id.toString(),
    name: g.name,
  }));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <RegisterForm token={token} email={invitation.email} groups={groups} />
    </div>
  );
}
