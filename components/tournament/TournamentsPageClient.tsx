'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, Users, UserCheck, ChevronDown, ChevronRight, UserRoundPlus } from 'lucide-react';
import TournamentCard from './TournamentCard';
import FetchTournamentForm from './FetchTournamentForm';
import { GroupAssignPopover } from './GroupAssignPopover';

interface TournamentSummary {
  id: number;
  name: string;
  full_header_image_url: string;
  start_datetime: string;
  event_status: string;
  store: { name: string } | null;
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
                  <TournamentCard tournament={t as never} contextLabel={section.groupName} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
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

  const getAssignedGroups = (tournamentId: number): AdminGroup[] => {
    const ids = assignments[tournamentId] ?? [];
    return adminGroups.filter((g) => ids.includes(g.groupId));
  };

  const handleToggleGroup = async (tournamentId: number, groupId: string, assign: boolean) => {
    // Optimistic update
    setAssignments((prev) => ({
      ...prev,
      [tournamentId]: assign
        ? [...(prev[tournamentId] ?? []), groupId]
        : (prev[tournamentId] ?? []).filter((id) => id !== groupId),
    }));

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
    }
  };

  return (
    <div className="flex flex-col gap-6 mt-6">

      {/* ── Recherche / ajout d'un tournoi ── */}
      <FetchTournamentForm
        onSubmitCallback={(data) => router.push(`/tournaments/${data.id}`)}
      />

      {/* ── Section 1 : Tous les tournois ── */}
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
                <div key={t.id} className="relative group/card">
                  <Link href={`/tournaments/${t.id}`} className="block">
                    <TournamentCard
                      tournament={t as never}
                      assignedGroups={assignedGroups}
                    />
                  </Link>

                  {hasAdminGroups && (
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenPopover((p) => (p === t.id ? null : t.id));
                      }}
                      title="Associer à un groupe"
                      className={`absolute bottom-3 right-3 h-7 w-7 rounded-md border border-border bg-card flex items-center justify-center transition-all hover:bg-accent z-10 ${
                        assignedGroups.length > 0
                          ? 'opacity-100 border-primary/50 text-primary'
                          : 'opacity-0 group-hover/card:opacity-100 text-muted-foreground'
                      }`}
                    >
                      <UserRoundPlus className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {openPopover === t.id && (
                    <GroupAssignPopover
                      tournamentId={t.id}
                      adminGroups={adminGroups}
                      assignedGroupIds={assignments[t.id] ?? []}
                      onToggle={(groupId, assign) => handleToggleGroup(t.id, groupId, assign)}
                      onClose={() => setOpenPopover(null)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}

      {/* ── Section 2 : Par groupe ── */}
      {groupSections.length > 0 && (
        <CollapsibleSection
          icon={Users}
          title="Par groupe"
          subtitle="Scooting partagé avec les membres de chaque groupe."
        >
          <div className="flex flex-col gap-3">
            {groupSections.map((s) => (
              <GroupSubSection key={s.groupId} section={s} />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* ── Section 3 : Invitations temporaires ── */}
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
                  tournament={entry.tournament as never}
                  contextLabel={`Invité — ${entry.groupName}`}
                  contextColor="info"
                  expiresAt={entry.expiresAt}
                />
              </Link>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
