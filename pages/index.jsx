/** @jsxImportSource @emotion/react */
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Layout from '@components/Layout';
import FileOpenIcon from '@mui/icons-material/FileOpen';
export default function Home() {
	return (
		<Layout>
			<Typography variant="h3" gutterBottom>
				Ressources
			</Typography>
			<List>
				<ListItemButton
					target="_blank"
					rel="noopener"
					component="a"
					href="https://docs.google.com/spreadsheets/d/1L8JThA3Tomrsq1GjsGV3tvPWpRPdSAYenSUtF6BRBsI/edit?usp=sharing"
				>
					<ListItemIcon>
						<FileOpenIcon />
					</ListItemIcon>
					<ListItemText primary="Excel de report des matchs" />
				</ListItemButton>
			</List>
		</Layout>
	);
}
