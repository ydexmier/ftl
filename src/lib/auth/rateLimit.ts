interface Entry { attempts: number; windowStart: number; blockedUntil?: number; }

const store = new Map<string, Entry>();
const MAX = 5, WINDOW = 15 * 60 * 1000, BLOCK = 15 * 60 * 1000;

export function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now(), e = store.get(key);
  if (e?.blockedUntil && now < e.blockedUntil) return { allowed: false, retryAfter: Math.ceil((e.blockedUntil - now) / 1000) };
  if (!e || now - e.windowStart > WINDOW) { store.set(key, { attempts: 1, windowStart: now }); return { allowed: true }; }
  e.attempts++;
  if (e.attempts > MAX) { e.blockedUntil = now + BLOCK; return { allowed: false, retryAfter: Math.ceil(BLOCK / 1000) }; }
  return { allowed: true };
}

export function recordFailedAttempt(key: string) {
  const now = Date.now(), e = store.get(key);
  if (!e || now - e.windowStart > WINDOW) store.set(key, { attempts: 1, windowStart: now });
  else { e.attempts++; if (e.attempts >= MAX) e.blockedUntil = now + BLOCK; }
}

export function resetRateLimit(key: string) { store.delete(key); }
