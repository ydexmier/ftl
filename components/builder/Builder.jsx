import React, { useReducer, useMemo, useEffect } from 'react';
import styled from '@emotion/styled';
import * as R from 'ramda';
import Card from '../card';
import { Grid } from '@mui/material';
import builderReducer from './builderReducer';
import Ink from '../Ink';
import InkCount from '../InkCount';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useSelectedCardsStore } from '../stores/useSelectedCardsStore';

const CardList = styled.div`
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, 1fr);
    @media(min-width: 768px) {
        gap: 16px;
        grid-template-columns: repeat(3, 1fr);
    }
    @media(min-width: 1024px) {
        gap: 24px;
        grid-template-columns: repeat(4, 1fr);
    }
    @media(min-width: 1260px) {
        grid-template-columns: repeat(4, 1fr);
    }
`;
const CardContainer = styled.div`
    text-align: center;
`;

const CardHorizontal = styled.div`
    display: grid;
align-items: center;
    grid-template-columns: auto auto 1fr auto;
    margin: 1px;
    padding-right: 2px;
    border: solid 1px #e5e7eb;
    border-color: #ffffff4d;
    border-width: 1px;
    border-bottom-with: 0;
    border-radius: 9999px;
   ${({ ink }) => {
        switch (ink) {
            case 'Amber':
                return ' background-color: rgb(103 41 0 / 1)';
            case 'Amethyst':
                return '';
            case 'Emerald':
                return '';
            case 'Ruby':
                return '';
            case 'Sapphire':
                return '';
            case 'Steel':
                return '';
        }
    }};
`

const ButtonsContianer = styled.div`
    display: flex;
    align-items: center;
`;

const Builder = () => {
    const builderCards = useSelectedCardsStore(state => state.builderCards);
    const setCardQuantity = useSelectedCardsStore(state => state.setCardQuantity);
    const cardsSelected = builderCards.filter(card => card.quantitySelected > 0)
    const addCard = ({ id, quantitySelected = 0 }) => setCardQuantity(id, quantitySelected + 1);
    const removeCard = ({ id, quantitySelected = 0 }) => setCardQuantity(id, quantitySelected - 1);

    return builderCards && <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 8 }}>
            <CardList>
                {
                    builderCards.map(card =>
                        <CardContainer key={card.id}>
                            <Card data={card}></Card>
                            <IconButton sx={{ marginRight: '8px' }} onClick={() => removeCard(card)} aria-label="remove">
                                <RemoveCircleOutlineIcon />
                            </IconButton>
                            {card.quantitySelected || 0}/{card.quantity}
                            <IconButton sx={{ marginLeft: '8px' }} onClick={() => addCard(card)} aria-label="add">
                                <AddCircleOutlineIcon />
                            </IconButton>
                        </CardContainer>)
                }
            </CardList>
        </Grid>
        <Grid size={{ xs: 6, md: 4 }}>
            <div>Nombre de carte: {builderCards.reduce((sum, card) => sum + card.quantitySelected || 0, 0)}</div>
            {
                cardsSelected.map(card =>
                    <CardHorizontal ink={card.inks?.join('-') || card.ink.toLowerCase()} key={card.id}>
                        <Ink type={card.inks || card.ink} width={32} />
                        <InkCount count={card.cost} size={32} />
                        <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{`${card.name}${card.version ? ` - ${card.version}` : ''} ${card.quantitySelected}/${card.quantity}`}</div>

                        <ButtonsContianer>
                            <IconButton sx={{ marginRight: '8px' }} onClick={() => removeCard(card)} aria-label="remove">
                                <RemoveCircleOutlineIcon />
                            </IconButton>
                            {card.quantitySelected || 0}/{card.quantity}
                            <IconButton sx={{ marginLeft: '8px' }} onClick={() => addCard(card)} aria-label="add">
                                <AddCircleOutlineIcon />
                            </IconButton>
                        </ButtonsContianer>
                    </CardHorizontal>
                )
            }
        </Grid>
    </Grid>
}

export default Builder;