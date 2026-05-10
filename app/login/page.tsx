'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Alert } from '@components/ui/Alert';

export default function LoginPage() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error || 'Identifiants invalides');
				return;
			}
			router.push(data.role === 'ADMIN' || data.role === 'SUPERUSER' ? '/admin/dashboard' : '/');
		} catch {
			setError('Erreur reseau.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-background flex items-center justify-center px-4">
			<div className="w-full max-w-sm">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-foreground tracking-tight">Companion</h1>
					<p className="text-muted-foreground text-sm mt-1">Disney Lorcana Tournament Companion</p>
				</div>
				<div className="bg-card border border-border rounded-xl p-8 shadow-xl">
					<h2 className="text-lg font-semibold text-foreground mb-6">Connexion</h2>
					{error && (
						<div className="mb-4">
							<Alert severity="error">{error}</Alert>
						</div>
					)}
					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						<Input
							label="Identifiant"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							autoComplete="username"
							required
						/>
						<Input
							label="Mot de passe"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="current-password"
							required
						/>
						<Button type="submit" variant="default" className="w-full mt-2" loading={loading}>
							Se connecter
						</Button>
						<Link href="/forgot-password" className="text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
							Mot de passe oublié ?
						</Link>
					</form>
				</div>
			</div>
		</div>
	);
}
