// components/scooting/components/RoundSearch.js
import { memo } from 'react';
import { TextField } from '@mui/material';

const RoundSearch = memo(({ value, onChange }) => (
	<TextField
		fullWidth
		variant="outlined"
		label="Rechercher un joueur ou un match"
		value={value}
		onChange={(e) => onChange(e.target.value)}
	/>
));

export default RoundSearch;
