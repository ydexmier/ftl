import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import AdbIcon from '@mui/icons-material/Adb';
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
                        <MenuItem >
                            <Link underline='none' href="/openBoosters"><Typography >Ouvrir des boosters</Typography></Link>
                        </MenuItem>
                        <MenuItem  >
                            <Link underline='none' href="/builder"><Typography >Builder</Typography></Link>
                        </MenuItem>
                        <MenuItem >
                            <Link underline='none' href="/sets"><Typography >Sets</Typography></Link>
                        </MenuItem>
                    </Toolbar>
                </Container>
            </AppBar>
            <main><Container sx={{ pl: 4, pr: 4 }}>{children}</Container></main>
        </>
    );
}