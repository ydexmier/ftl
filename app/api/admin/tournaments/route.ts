import { NextRequest, NextResponse } from 'next/server';
import { TournamentService } from '@/src/services/TournamentService';

export async function DELETE(request: NextRequest) {
	const { id } = await request.json();
	if (!id) return NextResponse.json({ error: 'Tournament id requis' }, { status: 400 });

	try {
		const result = await TournamentService.delete(Number(id));
		return NextResponse.json({
			message: `Tournament ${id} et ses données associées supprimés avec succès`,
			...result,
		});
	} catch (err) {
		const msg = (err as Error).message;
		if (msg.includes('not found')) return NextResponse.json({ error: msg }, { status: 404 });
		console.error('Erreur API tournaments:', err);
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
