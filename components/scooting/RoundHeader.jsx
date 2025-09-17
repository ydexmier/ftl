// components/RoundHeader.js
import React from 'react';
import { Grid } from '@mui/material';

import FetchButton from '@components/FetchButton';

const RoundHeader = React.memo(({ updatedAt, onRefresh }) => (
	<Grid container spacing={1} sx={{ my: 2, justifyContent: 'space-between', alignItems: 'center' }}>
		<h2>Matchs</h2>
		<FetchButton defaultLabel="MAJ Round" onFetch={onRefresh} refreshDelay={60} lastUpdate={updatedAt} />
	</Grid>
));

export default RoundHeader;
