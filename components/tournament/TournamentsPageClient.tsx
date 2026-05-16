'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { BookUser, Users, UserCheck, ChevronDown, ChevronRight, ArchiveX } from 'lucide-react';
import TournamentCard from './TournamentCard';
import { TournamentSearchBar } from './TournamentSearchBar';
import { GroupAssignPopover } from './GroupAssignPopover';
import { TournamentsTour } from '@components/ui/TournamentsTour';
import {
  useTournamentManagement,
  type TournamentSummary,
  type GroupSection,
  type AdminGroup,
} from '@/src/hooks/useTournamentManagement';

interface InvitedEntry {
  accessId: string;
  groupId: string;
  groupName: string;
  expiresAt: string;
  tournament: TournamentSummary;
}

interface Props {
  personalTournaments: TournamentSummary[];
  archivedTournaments?: TournamentSummary[];
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
        className="w-full flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 bg-card hover:bg-accent/50 transition-colors text-left"
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

function GroupSubSection({
  section,
  onArchive,
  onRestore,
}: {
  section: GroupSection;
  onArchive?: (tournamentId: number) => void;
  onRestore?: (tournamentId: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const isAdmin = section.myRole === 'ADMIN';
  const archived = section.archivedTournaments ?? [];

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
          {archived.length > 0 && (
            <span className="text-xs text-muted-foreground">· {archived.length} archivé{archived.length !== 1 ? 's' : ''}</span>
          )}
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
        <div className="p-4 flex flex-col gap-3">
          {section.tournaments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
              Aucun tournoi actif dans ce groupe.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {section.tournaments.map((t) => (
                <Link key={t.id} href={`/tournaments/${t.id}?groupId=${section.groupId}`} className="block">
                  <TournamentCard
                    tournament={t}
                    contextLabel={section.groupName}
                    onArchiveClick={isAdmin && onArchive ? (e) => { e.preventDefault(); e.stopPropagation(); onArchive(t.id); } : undefined}
                  />
                </Link>
              ))}
            </div>
          )}

          {archived.length > 0 && (
            <div>
              <button
                onClick={() => setShowArchived((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                {showArchived ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                {showArchived ? 'Masquer' : 'Voir'} les archivés ({archived.length})
              </button>
              {showArchived && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  {archived.map((t) => (
                    <Link key={t.id} href={`/tournaments/${t.id}?groupId=${section.groupId}`} className="block">
                      <TournamentCard
                        tournament={t}
                        contextLabel="Archivé"
                        contextColor="secondary"
                        onArchiveClick={isAdmin && onRestore ? (e) => { e.preventDefault(); e.stopPropagation(); onRestore(t.id); } : undefined}
                        isArchived
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TournamentsPageClient({
  personalTournaments,
  archivedTournaments = [],
  groupSections,
  invitedTournaments,
  adminGroups = [],
  initialAssignments = {},
}: Props) {
  const {
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
  } = useTournamentManagement({
    personalTournaments,
    archivedTournaments,
    groupSections,
    adminGroups,
    initialAssignments,
  });

  return (
    <div className="flex flex-col gap-6 mt-6">
      <TournamentsTour />
      <div data-tour="tournaments-search">
        <TournamentSearchBar
          onLinked={(t) => setLocalPersonal((prev) => [t, ...prev.filter((p) => p.id !== t.id)])}
        />
      </div>

      {/* Section 1 : Mes tournois */}
      {localPersonal.length > 0 && (
        <div data-tour="tournaments-personal">
          <CollapsibleSection
            icon={BookUser}
            title="Mes tournois"
            count={localPersonal.length}
            subtitle="Tournois liés à votre compte, visibles uniquement par vous."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {localPersonal.map((t) => {
                const assignedGroups = getAssignedGroups(t.id);
                return (
                  <div key={t.id} ref={setCardRef(t.id)}>
                    <Link href={`/tournaments/${t.id}`} className="block">
                      <TournamentCard
                        tournament={t}
                        assignedGroups={assignedGroups}
                        showAssignButton={adminGroups.length > 0}
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
                        onArchiveClick={(e) => handleArchive(t.id, e)}
                      />
                    </Link>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Section 2 : Par groupe */}
      {localGroupSections.length > 0 && (
        <div data-tour="tournaments-groups">
          <CollapsibleSection
            icon={Users}
            title="Par groupe"
            subtitle="Scooting partagé avec les membres de chaque groupe."
          >
            <div className="flex flex-col gap-3">
              {localGroupSections.map((s) => (
                <GroupSubSection
                  key={s.groupId}
                  section={s}
                  onArchive={(tid) => handleGroupArchive(s.groupId, tid)}
                  onRestore={(tid) => handleGroupRestore(s.groupId, tid)}
                />
              ))}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Section 3 : Invitations temporaires */}
      {invitedTournaments.length > 0 && (
        <CollapsibleSection
          icon={UserCheck}
          title="Invitations temporaires"
          count={invitedTournaments.length}
          subtitle="Accès ponctuels accordés par un admin de groupe."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
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

      {/* Section 4 : Archivés */}
      {localArchived.length > 0 && (
        <CollapsibleSection
          icon={ArchiveX}
          title="Archivés"
          count={localArchived.length}
          subtitle="Tournois masqués. Restaurez-les pour les retrouver dans vos tournois actifs."
          defaultOpen={false}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {localArchived.map((t) => (
              <Link key={t.id} href={`/tournaments/${t.id}`} className="block">
                <TournamentCard
                  tournament={t}
                  contextLabel="Archivé"
                  contextColor="secondary"
                  onArchiveClick={(e) => handleRestore(t.id, e)}
                  isArchived
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
