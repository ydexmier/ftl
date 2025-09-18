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
					href="https://profuse-smash-889.notion.site/Scooting-272f07a4069a809f951cc08bf8e116a1?pvs=73"
				>
					<ListItemIcon>
						<FileOpenIcon />
					</ListItemIcon>
					<ListItemText primary="Tutoriel du scooting (Notion)" />
				</ListItemButton>
			</List>
		</Layout>
	);
}
