import { Card, CardMedia, CardContent, Typography, Chip } from '@mui/material';

const TournamentCard = ({ tournament }) => {
	return (
		<Card
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				textDecoration: 'none !important',
				color: 'inherit',
				cursor: 'pointer',
				transition: 'transform 0.2s ease, box-shadow 0.2s ease', // ✅ animation
				'&:hover': {
					transform: 'translateY(-4px)', // ✅ léger lift
					boxShadow: 6,
				},
			}}
		>
			{tournament.full_header_image_url && (
				<CardMedia
					component="img"
					image={tournament.full_header_image_url}
					alt={tournament.name}
					sx={{
						height: 140,
						objectFit: 'cover',
						transition: 'transform 0.3s ease', // ✅ animation image
						'&:hover': {
							transform: 'scale(1.05)', // ✅ zoom au hover
						},
					}}
				/>
			)}
			<CardContent sx={{ flexGrow: 1 }}>
				<Chip label={`ID: ${tournament.id}`} color="primary" size="small" sx={{ mb: 1 }} />
				<Typography
					variant="h6"
					sx={{
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical',
					}}
				>
					{tournament.name || 'Sans nom'}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{tournament.start_datetime ? new Date(tournament.start_datetime).toLocaleDateString() : ''}
				</Typography>
			</CardContent>
		</Card>
	);
};

export default TournamentCard;
