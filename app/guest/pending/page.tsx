'use client';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Button } from '@components/ui/Button';

export default function GuestPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-lg p-8 shadow-xl text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-900/20 border border-yellow-700">
            <Clock className="h-6 w-6 text-yellow-400" />
          </div>
        </div>
        <h1 className="text-lg font-bold text-foreground mb-2">En attente de validation</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Ton compte a été créé. Un administrateur du groupe doit valider ta demande avant que tu puisses
          accéder au tournoi. Tu recevras un email dès que ton accès sera approuvé.
        </p>
        <Link href="/guest/dashboard">
          <Button className="w-full" variant="outline">
            Voir mes tournois
          </Button>
        </Link>
      </div>
    </div>
  );
}
