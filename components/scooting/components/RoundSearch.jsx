// components/scooting/components/RoundSearch.js
import { TextField } from '@mui/material';

import { memo } from 'react';

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
