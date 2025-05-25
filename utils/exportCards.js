export const exportCards = (cards, useQuantitySelected = false) => {
    return cards
        .map((card) => {
            const versionText = card.version ? ` - ${card.version}` : '';
            return `${
                useQuantitySelected ? card.quantitySelected || 0 : card.quantity
            } ${card.name}${versionText}`;
        })
        .join('\n');
};
