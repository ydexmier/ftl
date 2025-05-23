import React, { useReducer } from 'react';
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

const inkOrder = ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'];

const sortByInkOrder = R.sortWith([
    R.descend(R.prop('quantity')),
    R.ascend(item => inkOrder.indexOf(item.ink))
]);

const mergedCards = (cards) => Object.values(
    cards.reduce((acc, card) => {
        const key = card.id;
        if (!acc[key]) {
            acc[key] = { ...card, quantity: 1 };
        } else {
            acc[key].quantity += 1;
        }
        return acc;
    }, {})
);

const Builder = ({ cards }) => {
    const [builderCards, dispatch] = useReducer(builderReducer, sortByInkOrder(mergedCards(cards)));
    const cardsSelected = builderCards.filter(card => card.quantitySelected > 0)
    const addCard = ({ id }) => dispatch({ type: 'ADD_QUANTITY', payload: { id } });
    const removeCard = ({ id }) => dispatch({ type: 'REMOVE_QUANTITY', payload: { id } });
    return <Grid container spacing={2}>
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
            <div>Nombre de carte: {cardsSelected.reduce((sum, card) => sum + card.quantitySelected || 0, 0)}</div>
            {
                cardsSelected.map(card =>
                    <CardHorizontal ink={card.inks?.join('-') || card.ink.toLowerCase()} key={card.id}>
                        <Ink type={card.inks || card.ink} width={32} />
                        <InkCount count={card.cost} size={32} />
                        {`${card.name}${card.version ? ` - ${card.version}` : ''} ${card.quantitySelected}/${card.quantity}`}

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