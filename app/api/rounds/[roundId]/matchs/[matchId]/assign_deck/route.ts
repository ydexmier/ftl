import { NextRequest, NextResponse } from 'next/server';
import { ScoutingService } from '@/src/services/ScoutingService';

type Params = { params: Promise<{ roundId: string; matchId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
	try {
		const { roundId, matchId } = await params;
		const { decks } = await request.json();

		const result = await ScoutingService.assignDecks(Number(roundId), Number(matchId), decks);
		return NextResponse.json(result);
	} catch (err) {
		const msg = (err as Error).message;
		if (msg === 'Round not found' || msg === 'Match not found') {
			return NextResponse.json({ error: msg }, { status: 404 });
		}
		console.error(err);
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
