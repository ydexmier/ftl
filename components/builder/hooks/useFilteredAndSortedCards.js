import * as R from 'ramda';
import {useFilterStore} from '../../stores/useFilterBuilderStore';

const useFilteredAndSortedCards = (cards) => {
    const {ink, cost, order} = useFilterStore();

    const isInkSelected = (card) => R.includes(card.ink, ink);
    const isCostSelected = (card) => {
        return R.any((selected) => {
            if (selected === '9+') return card.cost >= 9;
            return card.cost === selected;
        }, cost);
    };

    // Filtrage combiné
    const filtered = R.filter(
        R.allPass([isInkSelected, isCostSelected]),
        cards
    );

    // Tri selon "order"
    const sorter = (() => {
        switch (order) {
            case 'color-asc':
                return R.sortBy(R.prop('ink'));
            case 'color-desc':
                return R.sort(R.descend(R.prop('ink')));
            case 'cost-asc':
                return R.sortBy(R.prop('cost'));
            case 'cost-desc':
                return R.sort(R.descend(R.prop('cost')));
            default:
                return R.identity; // pas de tri
        }
    })();

    return sorter(filtered);
};

export default useFilteredAndSortedCards;
