import { NextRequest, NextResponse } from 'next/server';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { RoundService } from '@/src/services/RoundService';

type Params = { params: Promise<{ roundId: string; matchId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
	try {
		const { roundId, matchId } = await params;
		const match = await RoundService.getMatch(Number(roundId), Number(matchId));
		return NextResponse.json(match);
	} catch (err) {
		const msg = (err as Error).message;
		if (msg === 'Match not found') return NextResponse.json({ error: msg }, { status: 404 });
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}

export async function POST(request: NextRequest, { params }: Params) {
	try {
		const { roundId } = await params;
		const body = await request.json();
		const round = await RoundRepository.upsert({ id: Number(roundId), ...body });
		return NextResponse.json(round);
	} catch (err) {
		return NextResponse.json({ error: (err as Error).message }, { status: 500 });
	}
}
