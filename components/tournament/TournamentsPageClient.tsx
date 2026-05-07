'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Globe, Users, UserCheck, ChevronDown, ChevronRight } from 'lucide-react';
import TournamentCard from './TournamentCard';
import FetchTournamentForm from './FetchTournamentForm';

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

interface Props {
  publicTournaments: TournamentSummary[];
  groupSections: GroupSection[];
  invitedTournaments: InvitedEntry[];
}

function SectionHeader({
  icon: Icon,
  title,
  count,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="mt-0.5 h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {title}
          {count !== undefined && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">({count})</span>
          )}
        </h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">
      {text}
    </p>
  );
}

function GroupSubSection({ section }: { section: GroupSection }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-accent/50 transition-colors"
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
        <div className="p-4 bg-background/50">
          {section.tournaments.length === 0 ? (
            <EmptyState text="Aucun tournoi dans ce groupe." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {section.tournaments.map((t) => (
                <Link
                  key={t.id}
                  href={`/tournaments/${t.id}?groupId=${section.groupId}`}
                  className="block"
                >
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

export function TournamentsPageClient({ publicTournaments, groupSections, invitedTournaments }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-10 mt-6">

      {/* ── Section 1 : Tous les tournois ── */}
      {publicTournaments.length > 0 && (
        <section>
          <SectionHeader
            icon={Globe}
            title="Tous les tournois"
            count={publicTournaments.length}
            subtitle="Scooting personnel, visible uniquement par vous."
          />
          <FetchTournamentForm
            onSubmitCallback={(data) => router.push(`/tournaments/${data.id}`)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {publicTournaments.map((t) => (
              <Link key={t.id} href={`/tournaments/${t.id}`} className="block">
                <TournamentCard tournament={t as never} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Section 2 : Par groupe ── */}
      {groupSections.length > 0 && (
        <section>
          <SectionHeader
            icon={Users}
            title="Par groupe"
            subtitle="Scooting partagé avec les membres de chaque groupe."
          />
          <div className="flex flex-col gap-3">
            {groupSections.map((s) => (
              <GroupSubSection key={s.groupId} section={s} />
            ))}
          </div>
        </section>
      )}

      {/* ── Section 3 : Invitations temporaires ── */}
      {invitedTournaments.length > 0 && (
        <section>
          <SectionHeader
            icon={UserCheck}
            title="Invitations temporaires"
            count={invitedTournaments.length}
            subtitle="Accès ponctuels accordés par un admin de groupe."
          />
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
        </section>
      )}
    </div>
  );
}
