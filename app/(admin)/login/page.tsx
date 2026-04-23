'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Box, Button, Container, TextField, Typography, Paper, Alert, IconButton, Tooltip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

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
		<Container maxWidth="sm">
			<Paper elevation={3} sx={{ mt: 8, p: 4, position: 'relative' }}>
				<Tooltip title="Retour à l'accueil">
					<IconButton
						color="primary"
						sx={{ position: 'absolute', top: 16, right: 16 }}
						onClick={() => router.push('/')}
					>
						<HomeIcon />
					</IconButton>
				</Tooltip>

				<Typography variant="h4" align="center" gutterBottom>
					Admin Login
				</Typography>

				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						{error}
					</Alert>
				)}

				<Box
					component="form"
					onSubmit={handleSubmit}
					sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
				>
					<TextField
						label="Username"
						variant="outlined"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
					/>
					<TextField
						label="Password"
						variant="outlined"
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
					<Button type="submit" variant="contained" color="primary">
						Se connecter
					</Button>
				</Box>
			</Paper>
		</Container>
	);
}
