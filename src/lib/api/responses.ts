import { NextResponse } from 'next/server';

export const ApiResponse = {
  ok: (data: unknown, headers?: HeadersInit) =>
    NextResponse.json(data, headers ? { headers } : undefined),

  created: (data: unknown) =>
    NextResponse.json(data, { status: 201 }),

  noContent: () =>
    new NextResponse(null, { status: 204 }),

  badRequest: (error: string) =>
    NextResponse.json({ error }, { status: 400 }),

  unauthorized: (msg = 'Non autorisé') =>
    NextResponse.json({ error: msg }, { status: 401 }),

  forbidden: (msg = 'Accès refusé') =>
    NextResponse.json({ error: msg }, { status: 403 }),

  notFound: (msg = 'Not found') =>
    NextResponse.json({ error: msg }, { status: 404 }),

  conflict: (error: string) =>
    NextResponse.json({ error }, { status: 409 }),

  tooManyRequests: (msg: string) =>
    NextResponse.json({ error: msg }, { status: 429 }),

  serverError: (err: unknown) => {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  },
};
