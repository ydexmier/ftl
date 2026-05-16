import { redirect } from 'next/navigation';
import { getServerUser } from '@/src/lib/auth/getServerUser';
import { AdminSidebar } from '@components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const user = await getServerUser();
	if (!user) redirect('/login');
	if (user.role !== 'ADMIN' && user.role !== 'SUPERUSER') redirect('/');

	return (
		<div className="min-h-screen bg-background">
			<AdminSidebar />
			<div className="lg:pl-60 pt-14 lg:pt-0">
				<main className="p-4 lg:p-6">{children}</main>
			</div>
		</div>
	);
}
