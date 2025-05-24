import {NextResponse} from 'next/server';

export function middleware(req) {
    const authHeader = req.headers.get('authorization');

    // Si pas d'auth header, demander l'authentification
    if (!authHeader) {
        return new Response('Authentication required', {
            status: 401,
            headers: {
                'WWW-Authenticate': 'Basic realm="Secure Area"',
            },
        });
    }

    // Décodage base64 du header "Basic base64(user:password)"
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString(
        'ascii'
    );
    const [user, password] = credentials.split(':');

    // Remplace ces valeurs par ton user & password souhaités
    const USERNAME = 'ftlUser';
    const PASSWORD = 'ftlPassword';

    if (user === USERNAME && password === PASSWORD) {
        return NextResponse.next(); // accès autorisé
    }

    // Mauvais user/mot de passe
    return new Response('Access denied', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Secure Area"',
        },
    });
}

// Appliquer le middleware uniquement à certaines routes, par ex:
export const config = {
    matcher: ['/:path*'], // toutes les routes commençant par /admin
};
