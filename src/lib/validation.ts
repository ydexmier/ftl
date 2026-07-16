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


export function validateApiTokenName(body: unknown): ValidationResult<{ name: string }> {
  const name = typeof (body as Record<string, unknown>)?.name === 'string'
    ? ((body as Record<string, unknown>).name as string).trim()
    : '';
  if (!name) return err('Nom requis (max 100 caractères)');
  if (name.length > 100) return err('Nom requis (max 100 caractères)');
  return ok({ name });
}

// ─── Admin schemas ────────────────────────────────────────────────────────────

const USER_ROLES = ['USER', 'ADMIN', 'SUPERUSER'] as const;
type UserRole = (typeof USER_ROLES)[number];

export function validateAdminUserCreate(body: unknown): ValidationResult<{
  username: string;
  email: string;
  password: string;
  role: UserRole;
}> {
  const b = body as Record<string, unknown>;
  if (!b?.username || typeof b.username !== 'string' || !b.username.trim())
    return err('Le pseudo est requis');
  const username = b.username.trim();
  if (username.length > 30) return err('Le pseudo ne peut pas dépasser 30 caractères');
  if (!b?.email || typeof b.email !== 'string') return err('Email invalide');
  const email = b.email.trim().toLowerCase();
  if (!isValidEmail(email)) return err('Email invalide');
  if (!b?.password || typeof b.password !== 'string') return err('Le mot de passe est requis');
  const role: UserRole = USER_ROLES.includes(b.role as UserRole) ? (b.role as UserRole) : 'USER';
  return ok({ username: username.toLowerCase(), email, password: b.password, role });
}

export function validateAdminUserUpdate(body: unknown): ValidationResult<{
  username?: string;
  email?: string;
  role?: UserRole;
  password?: string;
  canCreateGroup?: boolean;
}> {
  const b = body as Record<string, unknown>;
  const data: { username?: string; email?: string; role?: UserRole; password?: string; canCreateGroup?: boolean } = {};
  if (b.username !== undefined) {
    if (typeof b.username !== 'string' || !b.username.trim()) return err('Le pseudo est invalide');
    if (b.username.trim().length > 30) return err('Le pseudo ne peut pas dépasser 30 caractères');
    data.username = b.username.trim().toLowerCase();
  }
  if (b.email !== undefined) {
    if (typeof b.email !== 'string') return err('Email invalide');
    const email = b.email.trim().toLowerCase();
    if (!isValidEmail(email)) return err('Email invalide');
    data.email = email;
  }
  if (b.role !== undefined) {
    if (!USER_ROLES.includes(b.role as UserRole)) return err('Rôle invalide');
    data.role = b.role as UserRole;
  }
  if (b.password !== undefined) {
    if (typeof b.password !== 'string') return err('Mot de passe invalide');
    data.password = b.password;
  }
  if (b.canCreateGroup !== undefined) {
    if (typeof b.canCreateGroup !== 'boolean') return err('canCreateGroup doit être un booléen');
    data.canCreateGroup = b.canCreateGroup;
  }
  if (Object.keys(data).length === 0) return err('Aucun champ à mettre à jour');
  return ok(data);
}

export function validateAdminGroupBody(body: unknown): ValidationResult<{
  name: string;
  description: string;
  infoMessage: string;
}> {
  const b = body as Record<string, unknown>;
  if (!b?.name || typeof b.name !== 'string' || !b.name.trim()) return err('Le nom du groupe est requis');
  const name = b.name.trim();
  if (name.length > 100) return err('Le nom ne peut pas dépasser 100 caractères');
  const description = typeof b.description === 'string' ? b.description.trim() : '';
  if (description.length > 500) return err('La description ne peut pas dépasser 500 caractères');
  const infoMessage = typeof b.infoMessage === 'string' ? b.infoMessage.trim() : '';
  if (infoMessage.length > 500) return err('Le message ne peut pas dépasser 500 caractères');
  return ok({ name, description, infoMessage });
}

export function validateAdminInvitationEmails(body: unknown): ValidationResult<{
  emails: string[];
  groupIds: string[];
}> {
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b?.emails) || b.emails.length === 0) return err('Au moins un email est requis');
  if (b.emails.length > 100) return err('Maximum 100 emails par envoi');
  const groupIds = Array.isArray(b.groupIds)
    ? b.groupIds.filter((id): id is string => typeof id === 'string')
    : [];
  return ok({ emails: b.emails as string[], groupIds });
}
