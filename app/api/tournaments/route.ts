import { NextRequest, NextResponse } from 'next/server';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';

export async function GET() {
	try {
		const tournaments = await TournamentRepository.findAll();
		return NextResponse.json(tournaments);
	} catch (err) {
		return NextResponse.json({ error: (err as Error).message }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const tournament = await TournamentRepository.upsert(body);
		return NextResponse.json(tournament);
	} catch (err) {
		return NextResponse.json({ error: (err as Error).message }, { status: 500 });
	}
}
