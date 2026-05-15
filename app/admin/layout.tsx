import { AdminSidebar } from '@components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen bg-background">
			<AdminSidebar />
			<div className="lg:pl-60 pt-14 lg:pt-0">
				<main className="p-6">{children}</main>
			</div>
		</div>
	);
}
