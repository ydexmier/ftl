import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Button } from '@mui/material';


export default function MyApp({ Component, pageProps }) {

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'dark',
        },
      }),
    []
  );
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
