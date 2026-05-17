export type Valid<T> = { ok: true; data: T };
export type Invalid = { ok: false; error: string };
export type ValidationResult<T> = Valid<T> | Invalid;

function ok<T>(data: T): Valid<T> { return { ok: true, data }; }
function err(error: string): Invalid { return { ok: false, error }; }

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Route schemas ────────────────────────────────────────────────────────────

export function validateLoginBody(body: unknown): ValidationResult<{ username: string; password: string }> {
  const b = body as Record<string, unknown>;
  if (!b?.username || typeof b.username !== 'string' || !b.username.trim())
    return err('Identifiants invalides');
  if (!b?.password || typeof b.password !== 'string')
    return err('Identifiants invalides');
  return ok({ username: b.username.trim().toLowerCase(), password: b.password });
}

export function validateRegisterBody(body: unknown): ValidationResult<{ username: string; password: string }> {
  const b = body as Record<string, unknown>;
  if (!b?.username || typeof b.username !== 'string' || !b.username.trim())
    return err('Le pseudo est requis');
  if (b.username.trim().length > 30)
    return err('Le pseudo ne peut pas dépasser 30 caractères');
  if (!b?.password || typeof b.password !== 'string')
    return err('Le mot de passe est requis');
  return ok({ username: b.username.trim(), password: b.password });
}

export function validateForgotPasswordBody(body: unknown): ValidationResult<{ email: string }> {
  const b = body as Record<string, unknown>;
  if (!b?.email || typeof b.email !== 'string') return err('Email invalide');
  const email = b.email.trim().toLowerCase();
  if (!isValidEmail(email)) return err('Email invalide');
  return ok({ email });
}

export function validateResetPasswordBody(body: unknown): ValidationResult<{ password: string }> {
  const b = body as Record<string, unknown>;
  if (!b?.password || typeof b.password !== 'string') return err('Le mot de passe est requis');
  return ok({ password: b.password });
}

export function validateAccessRequestBody(body: unknown): ValidationResult<{
  email: string;
  reason?: string;
  captchaToken: string;
}> {
  const b = body as Record<string, unknown>;
  if (!b?.email || typeof b.email !== 'string') return err('Adresse email invalide');
  const email = b.email.trim().toLowerCase();
  if (!isValidEmail(email)) return err('Adresse email invalide');
  if (!b?.captchaToken || typeof b.captchaToken !== 'string')
    return err('Vérification anti-robot requise');
  const reason = typeof b.reason === 'string' ? b.reason.trim() || undefined : undefined;
  return ok({ email, reason, captchaToken: b.captchaToken });
}

const FEEDBACK_TYPES = ['bug', 'improvement'] as const;
type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export function validateFeedbackBody(body: unknown): ValidationResult<{
  type: FeedbackType;
  title: string;
  description: string;
  page: string;
}> {
  const b = body as Record<string, unknown>;
  if (!FEEDBACK_TYPES.includes(b?.type as FeedbackType)) return err('Type invalide');
  const title = typeof b.title === 'string' ? b.title.trim() : '';
  if (!title || title.length > 200) return err('Titre invalide (200 caractères max)');
  const description = typeof b.description === 'string' ? b.description.trim() : '';
  if (!description || description.length > 2000) return err('Description invalide (2000 caractères max)');
  if (!b?.page || typeof b.page !== 'string') return err('Page manquante');
  return ok({ type: b.type as FeedbackType, title, description, page: b.page });
}
