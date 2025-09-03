import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import AdbIcon from '@mui/icons-material/Adb';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';

export default function Layout({ children }) {
    return (
        <>
            <AppBar position="sticky">
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
                        <Typography
                            variant="h6"
                            noWrap
                            component="a"
                            href="#app-bar-with-responsive-menu"
                            sx={{
                                mr: 2,
                                display: { xs: 'none', md: 'flex' },
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                letterSpacing: '.3rem',
                                color: 'inherit',
                                textDecoration: 'none',
                            }}
                        >
                            LOGO
                        </Typography>

                        <MenuItem>
                            <Link underline='none' href="/"><Typography>Accueil</Typography></Link>
                        </MenuItem>
                        <MenuItem>
                            <Link underline='none' href="/tournaments"><Typography>Tournois</Typography></Link>
                        </MenuItem>

                        {/* Spacer pour pousser le menu admin à droite */}
                        <Box sx={{ marginLeft: 'auto' }}>
                            <MenuItem>
                                <Link underline='none' href="/admin/dashboard">
                                    <IconButton color="inherit">
                                        <AdminPanelSettingsIcon />
                                    </IconButton>
                                </Link>
                            </MenuItem>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>
            <main>
                <Container sx={{ pl: 4, pr: 4 }}>{children}</Container>
            </main>
        </>
    );
}
