'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { type TournamentCardData } from '@components/tournament/TournamentCard';
import { mergeTournamentsWithoutDuplicates } from '@/src/domain/rules/tournamentRules';

export interface TournamentSummary extends TournamentCardData {}

export interface GroupSection {
  groupId: string;
  groupName: string;
  myRole: string;
  infoMessage?: string;
  tournaments: TournamentSummary[];
  archivedTournaments?: TournamentSummary[];
}

export interface AdminGroup {
  groupId: string;
  groupName: string;
}

export interface FlyingCard {
  tournament: TournamentSummary;
  fromRect: DOMRect;
}

export interface UseTournamentManagementParams {
  personalTournaments: TournamentSummary[];
  archivedTournaments: TournamentSummary[];
  groupSections: GroupSection[];
  adminGroups: AdminGroup[];
  initialAssignments: Record<number, string[]>;
}

export function useTournamentManagement({
  personalTournaments,
  archivedTournaments,
  groupSections,
  adminGroups,
  initialAssignments,
}: UseTournamentManagementParams) {
  const [assignments, setAssignments] = useState<Record<number, string[]>>(initialAssignments);
  const [openPopover, setOpenPopover] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [localGroupSections, setLocalGroupSections] = useState<GroupSection[]>(groupSections);
  const [localPersonal, setLocalPersonal] = useState<TournamentSummary[]>(personalTournaments);
  const [localArchived, setLocalArchived] = useState<TournamentSummary[]>(archivedTournaments);
  const [flyingCard, setFlyingCard] = useState<FlyingCard | null>(null);
  const [isFlying, setIsFlying] = useState(false);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    setLocalPersonal((prev) => mergeTournamentsWithoutDuplicates(prev, personalTournaments));
  }, [personalTournaments]);

  const setCardRef = useCallback((id: number) => (el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);

  const getAssignedGroups = (tournamentId: number): AdminGroup[] => {
    const ids = assignments[tournamentId] ?? [];
    return adminGroups.filter((g) => ids.includes(g.groupId));
  };

  const handleArchive = async (tournamentId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const tournament = localPersonal.find((t) => t.id === tournamentId);
    if (!tournament) return;
    setLocalPersonal((prev) => prev.filter((t) => t.id !== tournamentId));
    setLocalArchived((prev) => [tournament, ...prev]);
    try {
      const res = await fetch(`/api/user/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setLocalPersonal((prev) => [tournament, ...prev]);
      setLocalArchived((prev) => prev.filter((t) => t.id !== tournamentId));
    }
  };

  const handleRestore = async (tournamentId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const tournament = localArchived.find((t) => t.id === tournamentId);
    if (!tournament) return;
    setLocalArchived((prev) => prev.filter((t) => t.id !== tournamentId));
    setLocalPersonal((prev) => [tournament, ...prev]);
    try {
      const res = await fetch(`/api/user/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setLocalArchived((prev) => [tournament, ...prev]);
      setLocalPersonal((prev) => prev.filter((t) => t.id !== tournamentId));
    }
  };

  const handleGroupArchive = async (groupId: string, tournamentId: number) => {
    setLocalGroupSections((prev) =>
      prev.map((s) => {
        if (s.groupId !== groupId) return s;
        const tournament = s.tournaments.find((t) => t.id === tournamentId);
        if (!tournament) return s;
        return {
          ...s,
          tournaments: s.tournaments.filter((t) => t.id !== tournamentId),
          archivedTournaments: [tournament, ...(s.archivedTournaments ?? [])],
        };
      }),
    );
    try {
      const res = await fetch(`/api/groups/${groupId}/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setLocalGroupSections((prev) =>
        prev.map((s) => {
          if (s.groupId !== groupId) return s;
          const tournament = (s.archivedTournaments ?? []).find((t) => t.id === tournamentId);
          if (!tournament) return s;
          return {
            ...s,
            tournaments: [tournament, ...s.tournaments],
            archivedTournaments: (s.archivedTournaments ?? []).filter((t) => t.id !== tournamentId),
          };
        }),
      );
    }
  };

  const handleGroupRestore = async (groupId: string, tournamentId: number) => {
    setLocalGroupSections((prev) =>
      prev.map((s) => {
        if (s.groupId !== groupId) return s;
        const tournament = (s.archivedTournaments ?? []).find((t) => t.id === tournamentId);
        if (!tournament) return s;
        return {
          ...s,
          tournaments: [tournament, ...s.tournaments],
          archivedTournaments: (s.archivedTournaments ?? []).filter((t) => t.id !== tournamentId),
        };
      }),
    );
    try {
      const res = await fetch(`/api/groups/${groupId}/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setLocalGroupSections((prev) =>
        prev.map((s) => {
          if (s.groupId !== groupId) return s;
          const tournament = s.tournaments.find((t) => t.id === tournamentId);
          if (!tournament) return s;
          return {
            ...s,
            tournaments: s.tournaments.filter((t) => t.id !== tournamentId),
            archivedTournaments: [tournament, ...(s.archivedTournaments ?? [])],
          };
        }),
      );
    }
  };

  const handleToggleGroup = async (tournamentId: number, groupId: string, assign: boolean) => {
    setAssignments((prev) => ({
      ...prev,
      [tournamentId]: assign
        ? [...(prev[tournamentId] ?? []), groupId]
        : (prev[tournamentId] ?? []).filter((id) => id !== groupId),
    }));

    if (assign) {
      setSuccessId(tournamentId);
      setOpenPopover(null);

      const cardEl = cardRefs.current.get(tournamentId);
      if (cardEl) {
        const fromRect = cardEl.getBoundingClientRect();
        const tournament = localPersonal.find((t) => t.id === tournamentId);
        if (tournament) {
          setFlyingCard({ tournament, fromRect });
          requestAnimationFrame(() => { requestAnimationFrame(() => { setIsFlying(true); }); });
          setTimeout(() => {
            setLocalGroupSections((prev) =>
              prev.map((s) =>
                s.groupId === groupId && !s.tournaments.find((t) => t.id === tournamentId)
                  ? { ...s, tournaments: [tournament, ...s.tournaments] }
                  : s,
              ),
            );
            setFlyingCard(null);
            setIsFlying(false);
          }, 650);
        }
      }
      setTimeout(() => setSuccessId(null), 1500);
    } else {
      setLocalGroupSections((prev) =>
        prev.map((s) =>
          s.groupId === groupId
            ? { ...s, tournaments: s.tournaments.filter((t) => t.id !== tournamentId) }
            : s,
        ),
      );
    }

    try {
      if (assign) {
        const res = await fetch(`/api/groups/${groupId}/tournaments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tournamentId }),
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch(`/api/groups/${groupId}/tournaments/${tournamentId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
      }
    } catch {
      setAssignments((prev) => ({
        ...prev,
        [tournamentId]: assign
          ? (prev[tournamentId] ?? []).filter((id) => id !== groupId)
          : [...(prev[tournamentId] ?? []), groupId],
      }));
      if (assign) {
        setLocalGroupSections((prev) =>
          prev.map((s) =>
            s.groupId === groupId
              ? { ...s, tournaments: s.tournaments.filter((t) => t.id !== tournamentId) }
              : s,
          ),
        );
      }
    }
  };

  return {
    localPersonal,
    localArchived,
    localGroupSections,
    assignments,
    successId,
    flyingCard,
    isFlying,
    isMounted,
    openPopover,
    setOpenPopover,
    setLocalPersonal,
    handleArchive,
    handleRestore,
    handleGroupArchive,
    handleGroupRestore,
    handleToggleGroup,
    getAssignedGroups,
    setCardRef,
  };
}
