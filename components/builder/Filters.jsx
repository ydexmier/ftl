import React from 'react';
import styled from '@emotion/styled';

import { Grid, Box } from '@mui/material';
import Ink, { types } from '../Ink';
import InkCount from '../InkCount';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useSelectedCardsStore } from '../stores/useSelectedCardsStore';

const Filters = () => {

    return <>{types.map(type => <Ink type={type} width={32} />)}</>
}

export default Filters;