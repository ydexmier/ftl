import React from 'react'
import styled from '@emotion/styled';
import Card from './card';

const GridCards = styled.div`
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
`;

const BoosterView = ({ booster, title }) => {
    return <div>
        {title && <h3>{title}</h3>}
        <GridCards>
            {booster.map((card, i) => (
                <Card key={`booster${i}-${card.id}`} data={card} />
            ))}
        </GridCards>
    </div>
}

export default BoosterView;