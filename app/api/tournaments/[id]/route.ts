import { NextRequest, NextResponse } from 'next/server';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
	try {
		const { id } = await params;
		const tournament = await TournamentRepository.findById(Number(id));
		if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
		return NextResponse.json(tournament);
	} catch (err) {
		return NextResponse.json({ error: (err as Error).message }, { status: 500 });
	}
}

export async function DELETE(_req: NextRequest, { params }: Params) {
	try {
		const { id } = await params;
		const deleted = await TournamentRepository.deleteById(Number(id));
		if (!deleted) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
		return NextResponse.json({ message: 'Tournament deleted' });
	} catch (err) {
		return NextResponse.json({ error: (err as Error).message }, { status: 500 });
	}
}
