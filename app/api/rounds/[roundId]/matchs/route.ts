import { NextRequest, NextResponse } from 'next/server';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { RoundService } from '@/src/services/RoundService';

type Params = { params: Promise<{ roundId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
	try {
		const { roundId } = await params;
		const sp = request.nextUrl.searchParams;

		const data = await RoundService.getMatchesPaginated(Number(roundId), {
			page: Number(sp.get('page') ?? 1),
			perPage: Number(sp.get('perPage') ?? 10),
			search: sp.get('search') ?? '',
			excludeOnePlayerMatches: sp.get('excludeOnePlayerMatches') === 'true',
		});

		return NextResponse.json(data);
	} catch (err) {
		const msg = (err as Error).message;
		if (msg === 'ROUND_NOT_FOUND') return NextResponse.json({ error: msg }, { status: 404 });
		console.error('GET handler error:', err);
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
		console.error('POST handler error:', err);
		return NextResponse.json({ error: (err as Error).message }, { status: 500 });
	}
}
