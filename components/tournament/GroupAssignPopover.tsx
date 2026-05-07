'use client';
import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { Spinner } from '@components/ui/Spinner';

interface AdminGroup {
  groupId: string;
  groupName: string;
}

interface Props {
  adminGroups: AdminGroup[];
  assignedGroupIds: string[];
  onToggle: (groupId: string, assign: boolean) => Promise<void>;
  onClose: () => void;
}

export function GroupAssignPopover({ adminGroups, assignedGroupIds, onToggle, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const handleToggle = async (groupId: string, assign: boolean) => {
    setLoadingId(groupId);
    try {
      await onToggle(groupId, assign);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-1.5 z-50 bg-card border border-border rounded-lg shadow-xl py-1.5 min-w-48 w-max"
    >
      <p className="text-xs font-medium text-muted-foreground px-3 py-1">
        Associer à un groupe
      </p>
      {adminGroups.map((g) => {
        const assigned = assignedGroupIds.includes(g.groupId);
        const isLoading = loadingId === g.groupId;
        return (
          <button
            key={g.groupId}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => handleToggle(g.groupId, !assigned)}
            disabled={isLoading}
            className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-accent text-sm text-left transition-colors disabled:opacity-60"
          >
            {isLoading ? (
              <Spinner size="sm" />
            ) : (
              <div
                className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  assigned ? 'bg-primary border-primary' : 'border-border'
                }`}
              >
                {assigned && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
              </div>
            )}
            <span className="text-foreground">{g.groupName}</span>
          </button>
        );
      })}
    </div>
  );
}
