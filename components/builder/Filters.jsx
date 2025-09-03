import React from 'react';
import styled from '@emotion/styled';
import { Box, ButtonBase, Button, Divider, Select, MenuItem, FormControl } from '@mui/material';
import InkButton, { types } from '../InkButton';
import InkCount from '../InkCount';
import { useFilterStore, allCosts } from '../stores/useFilterBuilderStore';

// On empêche `isInactive` de passer dans le DOM grâce à shouldForwardProp
const StyledInkButton = styled(ButtonBase, {
    shouldForwardProp: (prop) => prop !== 'isInactive'
})(({ isInactive }) => ({
    transition: 'filter 0.3s, opacity 0.3s',
    padding: '4px',
    borderRadius: 99999,
    filter: isInactive ? 'grayscale(100%)' : 'none',
    opacity: isInactive ? 0.5 : 1,
    pointerEvents: 'auto'
}));

const Filters = (props) => {
    const { ink, cost, order, toggleInk, toggleCost, setOrder, resetFilters } = useFilterStore();
    const handleChange = (event) => {
        setOrder(event.target.value);
    };
    return <>
        <Box {...props} justifyContent="flex-start" display="flex" flexWrap="wrap">
            {types.map(type => <InkButton isInactive={!ink.includes(type)} onClick={() => toggleInk(type)} />)}
            <Divider orientation="vertical" flexItem />
            <Box>{allCosts.map(buttonCost => <StyledInkButton isInactive={!cost.includes(buttonCost)} onClick={() => toggleCost(buttonCost)}><InkCount count={buttonCost} size={36} /></StyledInkButton>)}</Box>
        </Box>
        <Box sx={{ marginTop: 2 }} gap={2} justifyContent="flex-start" display="flex" >
            <FormControl variant="outlined" size="small">
                <Select
                    value={order}
                    onChange={handleChange}
                >
                    <MenuItem value="color-asc">Couleur croissante</MenuItem>
                    <MenuItem value="color-desc">Couleur décroissante</MenuItem>
                    <MenuItem value="cost-asc">Coût croissant</MenuItem>
                    <MenuItem value="cost-desc">Coût décroissant</MenuItem>
                </Select>
            </FormControl>
            <Divider orientation="vertical" flexItem />
            <Button variant="text" onClick={resetFilters}>Réinitialiser</Button>
        </Box >
    </>
}

export default Filters;