import { NextRequest, NextResponse } from 'next/server';
import { RoundService } from '@/src/services/RoundService';

export async function POST(request: NextRequest) {
	const { tournamentId, roundId, options = {} } = await request.json();

	if (!tournamentId) return NextResponse.json({ error: 'TournamentId requis' }, { status: 400 });
	if (!roundId) return NextResponse.json({ error: 'RoundId requis' }, { status: 400 });

	try {
		const datas = await RoundService.fetchAndSave(Number(tournamentId), Number(roundId), options);
		return NextResponse.json({ message: 'Round récupéré !', datas });
	} catch (err) {
		console.error('Erreur fetchAndSaveRound:', err);
		return NextResponse.json({ error: (err as Error).message }, { status: 500 });
	}
}
