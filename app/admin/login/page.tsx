'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Home } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Alert } from '@components/ui/Alert';
import { Tooltip } from '@components/ui/Tooltip';

export default function AdminLogin() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		const res = await fetch('/api/admin/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password }),
		});

		if (res.ok) {
			Cookies.set('adminAuth', 'true', { expires: 1 });
			router.push('/admin/dashboard');
		} else {
			const data = await res.json();
			setError(data.error || 'Identifiants invalides');
		}
	};

	return (
		<div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
			<div className="relative w-full max-w-sm bg-card border border-border rounded-xl p-8 shadow-xl">
				<div className="absolute top-4 right-4">
					<Tooltip title="Retour à l'accueil">
						<Button variant="ghost" size="sm" onClick={() => router.push('/')}>
							<Home className="h-4 w-4" />
						</Button>
					</Tooltip>
				</div>

				<h1 className="text-2xl font-bold text-foreground text-center mb-6">Admin Login</h1>

				{error && (
					<div className="mb-4">
						<Alert severity="error">{error}</Alert>
					</div>
				)}

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<Input
						label="Username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
					/>
					<Input
						label="Password"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
					<Button type="submit" variant="default" className="w-full">
						Se connecter
					</Button>
				</form>
			</div>
		</div>
	);
}
