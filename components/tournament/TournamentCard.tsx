import { Badge } from '@components/ui/Badge';
import { UserRoundPlus, Check, MapPin, Users, Archive, ArchiveRestore } from 'lucide-react';

export interface TournamentCardData {
  id: number;
  name: string;
  start_datetime: string | null;
  end_datetime: string | null;
  event_status: string;
  registered_user_count: number;
  capacity: number;
  store: { name: string } | null;
  gameplay_format: { id: string; name: string } | null;
}

interface AssignedGroup {
  groupId: string;
  groupName: string;
}

interface TournamentCardProps {
  tournament: TournamentCardData;
  contextLabel?: string;
  contextColor?: 'primary' | 'info' | 'success' | 'warning' | 'secondary';
  expiresAt?: string;
  assignedGroups?: AssignedGroup[];
  showAssignButton?: boolean;
  isAssignSuccess?: boolean;
  isPopoverOpen?: boolean;
  onAssignClick?: (e: React.MouseEvent) => void;
  popoverSlot?: React.ReactNode;
  onArchiveClick?: (e: React.MouseEvent) => void;
  isArchived?: boolean;
}

const STATUS_CONFIG: Record<string, { strip: string; label: string; badge: 'success' | 'info' | 'secondary' | 'warning' }> = {
  LIVE:        { strip: 'bg-green-500',  label: 'En cours',  badge: 'success' },
  NOT_STARTED: { strip: 'bg-blue-500',   label: 'À venir',   badge: 'info' },
  ENDED:       { strip: 'bg-zinc-600',   label: 'Terminé',   badge: 'secondary' },
  COMPLETED:   { strip: 'bg-zinc-600',   label: 'Terminé',   badge: 'secondary' },
  CANCELLED:   { strip: 'bg-red-700',    label: 'Annulé',    badge: 'warning' },
};

const TournamentCard = ({
  tournament,
  contextLabel,
  contextColor = 'primary',
  expiresAt,
  assignedGroups,
  showAssignButton,
  isAssignSuccess,
  isPopoverOpen,
  onAssignClick,
  popoverSlot,
  onArchiveClick,
  isArchived,
}: TournamentCardProps) => {
  const status = STATUS_CONFIG[tournament.event_status] ?? { strip: 'bg-zinc-700', label: tournament.event_status, badge: 'secondary' as const };
  const hasCapacity = tournament.capacity > 0;
  const fillPct = hasCapacity ? Math.min((tournament.registered_user_count / tournament.capacity) * 100, 100) : 0;
  const fillColor = fillPct >= 90 ? 'bg-red-500' : fillPct >= 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="group/card flex flex-col h-full rounded-xl border border-border bg-card overflow-visible transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30">
      {/* Status strip */}
      <div className={`h-1 w-full rounded-t-xl shrink-0 ${status.strip}`} />

      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {tournament.gameplay_format && (
            <Badge label={tournament.gameplay_format.name} color="secondary" size="sm" />
          )}
          <Badge label={status.label} color={status.badge} size="sm" />
          {contextLabel && (
            <Badge label={contextLabel} color={contextColor} size="sm" />
          )}
        </div>

        {/* Name */}
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
          {tournament.name || 'Sans nom'}
        </h3>

        {/* Store */}
        {tournament.store && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{tournament.store.name}</span>
          </div>
        )}

        {/* Players gauge */}
        {hasCapacity && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {tournament.registered_user_count} / {tournament.capacity}
              </span>
              <span>{Math.round(fillPct)}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all ${fillColor}`} style={{ width: `${fillPct}%` }} />
            </div>
          </div>
        )}

        {/* Assigned groups */}
        {assignedGroups && assignedGroups.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {assignedGroups.slice(0, 3).map((g) => (
              <Badge key={g.groupId} label={g.groupName} color="secondary" size="sm" />
            ))}
            {assignedGroups.length > 3 && (
              <Badge label={`+${assignedGroups.length - 3}`} color="secondary" size="sm" />
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground">
              {tournament.start_datetime
                ? new Date(tournament.start_datetime).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                : ''}
            </p>
            {expiresAt && (
              <p className="text-xs text-muted-foreground">
                Expire le {new Date(expiresAt).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onArchiveClick && (
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={onArchiveClick}
                title={isArchived ? 'Restaurer' : 'Archiver'}
                className="h-7 w-7 rounded-md border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground flex items-center justify-center transition-colors"
              >
                {isArchived
                  ? <ArchiveRestore className="h-3.5 w-3.5" />
                  : <Archive className="h-3.5 w-3.5" />}
              </button>
            )}
            {showAssignButton && (
              <div className="relative">
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={onAssignClick}
                  title={isAssignSuccess ? 'Assigné !' : 'Associer à un groupe'}
                  className={`h-7 w-7 rounded-md border flex items-center justify-center transition-all duration-300 ${
                    isAssignSuccess
                      ? 'border-green-500 bg-green-500/20 text-green-400'
                      : isPopoverOpen
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {isAssignSuccess ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <UserRoundPlus className="h-3.5 w-3.5" />
                  )}
                </button>
                {isPopoverOpen && popoverSlot}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentCard;
