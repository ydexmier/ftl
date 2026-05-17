export function mergeTournamentsWithoutDuplicates<T extends { id: number }>(existing: T[], incoming: T[]): T[] {
  const existingIds = new Set(existing.map((t) => t.id));
  const fresh = incoming.filter((t) => !existingIds.has(t.id));
  return fresh.length > 0 ? [...fresh, ...existing] : existing;
}
