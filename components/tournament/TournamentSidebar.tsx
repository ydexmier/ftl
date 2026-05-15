'use client';
import { Crosshair, Users, BarChart2, Target } from 'lucide-react';
import { cn } from '@components/ui/cn';

export type TournamentTab = 'scouting' | 'players' | 'stats' | 'reports';

interface TabDef {
  id: TournamentTab;
  label: string;
  icon: React.ElementType;
}

const ALL_TABS: TabDef[] = [
  { id: 'scouting', label: 'Scouting', icon: Crosshair },
  { id: 'players', label: 'Joueurs', icon: Users },
  { id: 'stats', label: 'Statistiques', icon: BarChart2 },
  { id: 'reports', label: 'Reports', icon: Target },
];

interface TournamentSidebarProps {
  activeTab: TournamentTab;
  onTabChange: (tab: TournamentTab) => void;
  visibleTabs: TournamentTab[];
}

export function TournamentSidebar({ activeTab, onTabChange, visibleTabs }: TournamentSidebarProps) {
  const tabs = ALL_TABS.filter((t) => visibleTabs.includes(t.id));

  return (
    <nav className="flex gap-1 border-b border-border pb-0 mb-4 overflow-x-auto">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
            activeTab === id
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </button>
      ))}
    </nav>
  );
}
