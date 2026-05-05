import { NextRequest, NextResponse } from 'next/server';
import { TournamentService } from '@/src/services/TournamentService';

export async function POST(request: NextRequest) {
	const { tournamentId, isRefetch } = await request.json();

	if (!tournamentId) return NextResponse.json({ error: 'TournamentId requis' }, { status: 400 });

	try {
		const datas = await TournamentService.fetchAndSave(Number(tournamentId), isRefetch);
		return NextResponse.json({ message: 'Tournoi récupéré !', datas });
	} catch (err) {
		console.error('Erreur fetchAndSaveTournament:', err);
		return NextResponse.json({ error: (err as Error).message }, { status: 500 });
	}
}
