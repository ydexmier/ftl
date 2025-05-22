import React from 'react';
import styled from '@emotion/styled';
import * as R from 'ramda';
import Card from '../card';

const CardList = styled.div`
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
`;
const CardContainer = styled.div`
    flex: 0 0 10%;
`;

const inkOrder = ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'];

const sortByInkOrder = R.sortWith([
  R.descend(R.prop('quantity')),
  R.ascend(item => inkOrder.indexOf(item.ink))
]);

const Builder = ({ cards }) => {
    const cardsMerged = Object.values(
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
const cardsSorted = sortByInkOrder(cardsMerged);
    return <div>
        <CardList>
            {
                cardsSorted.map(card =>
                    <CardContainer>
                        <Card data={card}></Card>
                        <span>Quantité: {card.quantity}</span>
                    </CardContainer>)
            }
        </CardList>
    </div>
}

export default Builder;