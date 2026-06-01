'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Users, BarChart2, ShieldCheck, X } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { GuestInviteModal } from './GuestInviteModal';
import { ReportsTab } from './ReportsTab';

interface AdminGroup {
  groupId: string;
  groupName: string;
}

interface Props {
  tournamentId: number;
  tournamentName: string;
  adminGroups: AdminGroup[];
}

export function AdminGroupMenu({ tournamentId, tournamentName, adminGroups }: Props) {
  const [open, setOpen] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [activeGroup, setActiveGroup] = useState<AdminGroup>(adminGroups[0]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (action: 'guests' | 'reports') => {
    setOpen(false);
    if (action === 'guests') setShowGuestModal(true);
    else setShowReportsModal(true);
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        {adminGroups.length > 1 && (
          <select
            value={activeGroup.groupId}
            onChange={(e) => {
              const found = adminGroups.find((g) => g.groupId === e.target.value);
              if (found) setActiveGroup(found);
            }}
            className="h-9 rounded-md border border-border bg-card px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {adminGroups.map((g) => (
              <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
            ))}
          </select>
        )}

        <div className="relative" ref={menuRef}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Admin</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </Button>

          {open && (
            <div className="absolute right-0 top-full mt-1 z-30 w-44 rounded-md border border-border bg-card shadow-lg py-1">
              <button
                onClick={() => select('guests')}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
              >
                <Users className="h-4 w-4 text-muted-foreground" />
                Invités
              </button>
              <button
                onClick={() => select('reports')}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
              >
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                Rapports
              </button>
            </div>
          )}
        </div>
      </div>

      {showGuestModal && (
        <GuestInviteModal
          groupId={activeGroup.groupId}
          tournamentId={tournamentId}
          tournamentName={tournamentName}
          onClose={() => setShowGuestModal(false)}
        />
      )}

      {showReportsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowReportsModal(false)}>
          <div
            className="bg-card border border-border rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
              <div>
                <h2 className="font-semibold text-foreground">Rapports de scouting</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{activeGroup.groupName}</p>
              </div>
              <button onClick={() => setShowReportsModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              <ReportsTab groupId={activeGroup.groupId} tournamentId={tournamentId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
