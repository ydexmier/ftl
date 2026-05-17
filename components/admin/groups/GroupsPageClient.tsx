'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Users, Trophy } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { GroupCreateModal } from './GroupCreateModal';
import { GroupDeleteConfirm } from './GroupDeleteConfirm';

interface GroupRow {
  _id: string;
  name: string;
  memberCount: number;
  tournamentCount: number;
}

interface Props {
  groups: GroupRow[];
}

export function GroupsPageClient({ groups }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteGroup, setDeleteGroup] = useState<{ _id: string; name: string } | null>(null);

  const onMutationSuccess = () => {
    setCreateOpen(false);
    setDeleteGroup(null);
    router.refresh();
  };

  return (
    <>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Groupes</h1>
            {groups.length > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">{groups.length} groupe{groups.length > 1 ? 's' : ''}</p>
            )}
          </div>
          <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nouveau groupe
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Aucun groupe.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Nom</th>
                    <th className="px-4 py-3 text-left">Membres</th>
                    <th className="px-4 py-3 text-left">Tournois</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <tr key={g._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/groups/${g._id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                          {g.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {g.memberCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Trophy className="h-3.5 w-3.5" />
                          {g.tournamentCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteGroup({ _id: g._id, name: g.name })}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {createOpen && <GroupCreateModal onClose={() => setCreateOpen(false)} onSuccess={onMutationSuccess} />}
      {deleteGroup && (
        <GroupDeleteConfirm
          groupId={deleteGroup._id}
          groupName={deleteGroup.name}
          onClose={() => setDeleteGroup(null)}
          onSuccess={onMutationSuccess}
        />
      )}
    </>
  );
}
