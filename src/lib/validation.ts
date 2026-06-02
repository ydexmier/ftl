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

// ─── Admin schemas ────────────────────────────────────────────────────────────

const USER_ROLES = ['USER', 'ADMIN', 'SUPERUSER'] as const;
type UserRole = (typeof USER_ROLES)[number];

const FEEDBACK_STATUSES = ['open', 'in-progress', 'done', 'closed'] as const;
type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

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

export function validateAdminFeedbackStatus(body: unknown): ValidationResult<{ status: FeedbackStatus }> {
  const b = body as Record<string, unknown>;
  if (!FEEDBACK_STATUSES.includes(b?.status as FeedbackStatus))
    return err('Statut invalide');
  return ok({ status: b.status as FeedbackStatus });
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
