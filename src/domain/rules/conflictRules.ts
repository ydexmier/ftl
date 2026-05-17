export function countConflictsByTournament(conflicts: { tournamentId: number }[]): Record<number, number> {
  return conflicts.reduce<Record<number, number>>((acc, c) => {
    acc[c.tournamentId] = (acc[c.tournamentId] ?? 0) + 1;
    return acc;
  }, {});
}
