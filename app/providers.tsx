'use client';
import { useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

export default function Providers({ children }: { children: React.ReactNode }) {
	const theme = useMemo(() => createTheme({ palette: { mode: 'dark' } }), []);
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline enableColorScheme />
			{children}
		</ThemeProvider>
	);
}
