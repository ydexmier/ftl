const SECRET = process.env.SESSION_SECRET ?? 'CHANGE_ME_IN_PRODUCTION_32_CHARS!';

function toBase64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  bytes.forEach(b => s += String.fromCharCode(b));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromBase64url(s: string): ArrayBuffer {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signCookie(sessionId: string, role: string): Promise<string> {
  const data = sessionId + '|' + role;
  const sig = await crypto.subtle.sign('HMAC', await getKey(), new TextEncoder().encode(data));
  return data + '|' + toBase64url(sig);
}

export async function verifyCookie(val: string): Promise<{ sessionId: string; role: string } | null> {
  const parts = val.split('|');
  if (parts.length !== 3) return null;
  const [sessionId, role, sig] = parts;
  const data = sessionId + '|' + role;
  try {
    const ok = await crypto.subtle.verify('HMAC', await getKey(), fromBase64url(sig), new TextEncoder().encode(data));
    return ok ? { sessionId, role } : null;
  } catch { return null; }
}
