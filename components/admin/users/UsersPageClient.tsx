'use client';
import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { Badge } from '@components/ui/Badge';
import { UserCreateModal } from './UserCreateModal';
import { UserEditModal, type UserForEdit } from './UserEditModal';
import { UserDeleteConfirm } from './UserDeleteConfirm';
import type { UserRole } from '@models/User';

const ROLE_OPTIONS = [
  { value: '', label: 'Tous les rôles' },
  { value: 'USER', label: 'USER' },
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'SUPERUSER', label: 'SUPERUSER' },
];

const ROLE_BADGE: Record<UserRole, React.ComponentProps<typeof Badge>['color']> = {
  USER: 'secondary',
  ADMIN: 'info',
  SUPERUSER: 'error',
};

interface UserGroup {
  _id: string;
  name: string;
}

interface UserRow {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  groups: UserGroup[];
}

interface Props {
  users: UserRow[];
  total: number;
  page: number;
  pages: number;
  search: string;
  role: string;
}

function UserGroupsList({ groups }: { groups: UserGroup[] }) {
  if (groups.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const visible = groups.slice(0, 2);
  const overflow = groups.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((g) => (
        <span key={g._id} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground truncate max-w-[120px]" title={g.name}>
          {g.name}
        </span>
      ))}
      {overflow > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">+{overflow}</span>
      )}
    </div>
  );
}

export function UsersPageClient({ users, total, page, pages, search: initialSearch, role: initialRole }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState(initialSearch);
  const [role, setRole] = useState(initialRole);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserForEdit | null>(null);
  const [deleteUser, setDeleteUser] = useState<{ _id: string; username: string } | null>(null);

  const pushParams = useCallback((overrides: Record<string, string>) => {
    const params = new URLSearchParams({ search, role, page: String(page), ...overrides });
    if (!params.get('search')) params.delete('search');
    if (!params.get('role')) params.delete('role');
    if (params.get('page') === '1') params.delete('page');
    router.push(`${pathname}?${params}`);
  }, [search, role, page, pathname, router]);

  const applySearch = () => pushParams({ search, role, page: '1' });
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') applySearch(); };
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value);
    pushParams({ search, role: e.target.value, page: '1' });
  };

  const onMutationSuccess = () => {
    setCreateOpen(false);
    setEditUser(null);
    setDeleteUser(null);
    router.refresh();
  };

  return (
    <>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
            {total > 0 && <p className="text-sm text-muted-foreground mt-0.5">{total} utilisateur{total > 1 ? 's' : ''}</p>}
          </div>
          <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4" />
            Nouvel utilisateur
          </Button>
        </div>

        {/* Filtres */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex gap-2 w-full sm:flex-1">
            <Input
              placeholder="Rechercher par username ou email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              fullWidth
            />
            <Button variant="outline" onClick={applySearch} className="shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <Select options={ROLE_OPTIONS} value={role} onChange={handleRoleChange} className="w-full sm:min-w-36 sm:w-auto" />
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">Aucun utilisateur trouvé.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Utilisateur</th>
                    <th className="px-4 py-3 text-left hidden sm:table-cell">Email</th>
                    <th className="px-4 py-3 text-left">Rôle</th>
                    <th className="px-4 py-3 text-left hidden lg:table-cell">Groupes</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell whitespace-nowrap">Créé le</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/users/${u._id}`} className="flex items-center gap-2.5 group">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <span className="text-xs font-medium text-primary uppercase">{u.username[0]}</span>
                          </div>
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {u.username}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge label={u.role} color={ROLE_BADGE[u.role]} />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <UserGroupsList groups={u.groups} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs font-mono">
                        {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditUser({ _id: u._id, username: u.username, email: u.email, role: u.role })}
                            className="p-2 sm:p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteUser({ _id: u._id, username: u.username })}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Page {page} sur {pages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => pushParams({ page: String(page - 1) })}>
                <ChevronLeft className="h-3.5 w-3.5" />
                Précédent
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => pushParams({ page: String(page + 1) })}>
                Suivant
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {createOpen && <UserCreateModal onClose={() => setCreateOpen(false)} onSuccess={onMutationSuccess} />}
      {editUser && <UserEditModal user={editUser} onClose={() => setEditUser(null)} onSuccess={onMutationSuccess} />}
      {deleteUser && <UserDeleteConfirm userId={deleteUser._id} username={deleteUser.username} onClose={() => setDeleteUser(null)} onSuccess={onMutationSuccess} />}
    </>
  );
}
