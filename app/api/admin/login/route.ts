import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
	const { username, password } = await request.json();

	if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
		return NextResponse.json({ success: true });
	}
	return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
}
