import { Badge } from '@components/ui/Badge';
import type { Tournament } from '@/src/types/tournament';

interface TournamentCardProps {
  tournament: Tournament;
  contextLabel?: string;
  contextColor?: 'primary' | 'info' | 'success' | 'warning' | 'secondary';
  expiresAt?: string;
}

const TournamentCard = ({ tournament, contextLabel, contextColor = 'primary', expiresAt }: TournamentCardProps) => {
  return (
    <div className="group flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30">
      {tournament.full_header_image_url && (
        <div className="h-36 overflow-hidden shrink-0">
          <img
            src={tournament.full_header_image_url}
            alt={tournament.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge label={`ID: ${tournament.id}`} color="primary" size="sm" />
          {contextLabel && (
            <Badge label={contextLabel} color={contextColor} size="sm" />
          )}
        </div>
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
          {tournament.name || 'Sans nom'}
        </h3>
        <div className="flex items-center justify-between mt-auto pt-1">
          <p className="text-xs text-muted-foreground">
            {tournament.start_datetime
              ? new Date(tournament.start_datetime).toLocaleDateString('fr-FR')
              : ''}
          </p>
          {expiresAt && (
            <p className="text-xs text-muted-foreground">
              Expire le {new Date(expiresAt).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentCard;
