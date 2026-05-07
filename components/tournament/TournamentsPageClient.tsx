'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, Users, UserCheck, ChevronDown, ChevronRight } from 'lucide-react';
import TournamentCard, { type TournamentCardData } from './TournamentCard';
import FetchTournamentForm from './FetchTournamentForm';
import { GroupAssignPopover } from './GroupAssignPopover';

interface TournamentSummary extends TournamentCardData {
  // TournamentCardData already covers all fields needed
}

interface GroupSection {
  groupId: string;
  groupName: string;
  myRole: string;
  tournaments: TournamentSummary[];
}

interface InvitedEntry {
  accessId: string;
  groupId: string;
  groupName: string;
  expiresAt: string;
  tournament: TournamentSummary;
}

interface AdminGroup {
  groupId: string;
  groupName: string;
}

interface Props {
  publicTournaments: TournamentSummary[];
  groupSections: GroupSection[];
  invitedTournaments: InvitedEntry[];
  adminGroups?: AdminGroup[];
  initialAssignments?: Record<number, string[]>;
}

function CollapsibleSection({
  icon: Icon,
  title,
  count,
  subtitle,
  defaultOpen = true,
  children,
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-card hover:bg-accent/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="font-semibold text-foreground">
              {title}
              {count !== undefined && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">({count})</span>
              )}
            </span>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && <div className="p-5 bg-background/50">{children}</div>}
    </section>
  );
}

function GroupSubSection({ section }: { section: GroupSection }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-accent/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground text-sm">{section.groupName}</span>
          <span className="text-xs text-muted-foreground">
            {section.tournaments.length} tournoi{section.tournaments.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/groups/${section.groupId}/tournaments`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-primary hover:underline"
          >
            Gérer
          </Link>
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>
      {open && (
        <div className="p-4">
          {section.tournaments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
              Aucun tournoi dans ce groupe.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {section.tournaments.map((t) => (
                <Link key={t.id} href={`/tournaments/${t.id}?groupId=${section.groupId}`} className="block">
                  <TournamentCard tournament={t} contextLabel={section.groupName} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface FlyingCard {
  tournament: TournamentSummary;
  fromRect: DOMRect;
}

export function TournamentsPageClient({
  publicTournaments,
  groupSections,
  invitedTournaments,
  adminGroups = [],
  initialAssignments = {},
}: Props) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Record<number, string[]>>(initialAssignments);
  const [openPopover, setOpenPopover] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [localGroupSections, setLocalGroupSections] = useState<GroupSection[]>(groupSections);
  const [flyingCard, setFlyingCard] = useState<FlyingCard | null>(null);
  const [isFlying, setIsFlying] = useState(false);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const setCardRef = useCallback((id: number) => (el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);

  const getAssignedGroups = (tournamentId: number): AdminGroup[] => {
    const ids = assignments[tournamentId] ?? [];
    return adminGroups.filter((g) => ids.includes(g.groupId));
  };

  const handleToggleGroup = async (tournamentId: number, groupId: string, assign: boolean) => {
    setAssignments((prev) => ({
      ...prev,
      [tournamentId]: assign
        ? [...(prev[tournamentId] ?? []), groupId]
        : (prev[tournamentId] ?? []).filter((id) => id !== groupId),
    }));

    if (assign) {
      // Show success on button
      setSuccessId(tournamentId);
      setOpenPopover(null);

      // Start ghost card animation after a short delay
      const cardEl = cardRefs.current.get(tournamentId);
      if (cardEl) {
        const fromRect = cardEl.getBoundingClientRect();
        const tournament = publicTournaments.find((t) => t.id === tournamentId);
        if (tournament) {
          setFlyingCard({ tournament, fromRect });
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setIsFlying(true);
            });
          });

          // After animation: update local sections + clear ghost
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

      // Clear success state
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
        const res = await fetch(`/api/groups/${groupId}/tournaments/${tournamentId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error();
      }
    } catch {
      // Revert on error
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

  return (
    <div className="flex flex-col gap-6 mt-6">
      <FetchTournamentForm
        onSubmitCallback={(data) => router.push(`/tournaments/${data.id}`)}
      />

      {/* Section 1 : Tous les tournois */}
      {publicTournaments.length > 0 && (
        <CollapsibleSection
          icon={Globe}
          title="Tous les tournois"
          count={publicTournaments.length}
          subtitle="Scooting personnel, visible uniquement par vous."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {publicTournaments.map((t) => {
              const assignedGroups = getAssignedGroups(t.id);
              const hasAdminGroups = adminGroups.length > 0;
              return (
                <div key={t.id} ref={setCardRef(t.id)}>
                  <Link href={`/tournaments/${t.id}`} className="block">
                    <TournamentCard
                      tournament={t}
                      assignedGroups={assignedGroups}
                      showAssignButton={hasAdminGroups}
                      isAssignSuccess={successId === t.id}
                      isPopoverOpen={openPopover === t.id}
                      onAssignClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenPopover((p) => (p === t.id ? null : t.id));
                      }}
                      popoverSlot={
                        <GroupAssignPopover
                          adminGroups={adminGroups}
                          assignedGroupIds={assignments[t.id] ?? []}
                          onToggle={(groupId, assign) => handleToggleGroup(t.id, groupId, assign)}
                          onClose={() => setOpenPopover(null)}
                        />
                      }
                    />
                  </Link>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* Section 2 : Par groupe */}
      {localGroupSections.length > 0 && (
        <CollapsibleSection
          icon={Users}
          title="Par groupe"
          subtitle="Scooting partagé avec les membres de chaque groupe."
        >
          <div className="flex flex-col gap-3">
            {localGroupSections.map((s) => (
              <GroupSubSection key={s.groupId} section={s} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Section 3 : Invitations temporaires */}
      {invitedTournaments.length > 0 && (
        <CollapsibleSection
          icon={UserCheck}
          title="Invitations temporaires"
          count={invitedTournaments.length}
          subtitle="Accès ponctuels accordés par un admin de groupe."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {invitedTournaments.map((entry) => (
              <Link
                key={entry.accessId}
                href={`/tournaments/${entry.tournament.id}?groupId=${entry.groupId}`}
                className="block"
              >
                <TournamentCard
                  tournament={entry.tournament}
                  contextLabel={`Invité — ${entry.groupName}`}
                  contextColor="info"
                  expiresAt={entry.expiresAt}
                />
              </Link>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Ghost card animation portal */}
      {isMounted && flyingCard &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: flyingCard.fromRect.top,
              left: flyingCard.fromRect.left,
              width: flyingCard.fromRect.width,
              height: flyingCard.fromRect.height,
              transition: isFlying ? 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1), opacity 600ms ease' : 'none',
              transform: isFlying ? 'translateY(80px) scale(0.85)' : 'translateY(0) scale(1)',
              opacity: isFlying ? 0 : 1,
              pointerEvents: 'none',
              zIndex: 9999,
            }}
          >
            <TournamentCard tournament={flyingCard.tournament} />
          </div>,
          document.body,
        )}
    </div>
  );
}
