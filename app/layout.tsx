import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
	title: 'FTL',
	description: 'Disney Lorcana tournament companion',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="fr">
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
