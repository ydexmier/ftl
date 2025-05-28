// filterStore.js
import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import * as R from 'ramda';

export const allInks = [
    'Amber',
    'Amethyst',
    'Emerald',
    'Ruby',
    'Sapphire',
    'Steel',
];
export const allCosts = [1, 2, 3, 4, 5, 6, 7, 8, '9+'];

const initialFilterState = {
    ink: allInks,
    cost: allCosts,
    order: 'color-asc', // 'color-asc', 'color-desc', 'cost-asc', 'cost-desc'
};

export const useFilterStore = create(
    persist(
        (set, get) => ({
            ...initialFilterState,

            // INK
            toggleInk: (inkName) =>
                set((state) => {
                    const {ink} = state;
                    const isAllSelected = R.equals(
                        R.sortBy(R.identity, ink),
                        R.sortBy(R.identity, allInks)
                    );

                    return {
                        ink: isAllSelected
                            ? [inkName]
                            : R.includes(inkName, ink)
                            ? R.without([inkName], ink)
                            : R.append(inkName, ink),
                    };
                }),
            setInk: (inkArray) => set({ink: inkArray}),
            resetInk: () => set({ink: initialFilterState.ink}),

            // COST
            toggleCost: (value) =>
                set((state) => {
                    const {cost} = state;
                    const isAllSelected = R.equals(
                        R.sortBy(R.identity, cost),
                        R.sortBy(R.identity, allCosts)
                    );

                    return {
                        cost: isAllSelected
                            ? [value]
                            : R.includes(value, cost)
                            ? R.without([value], cost)
                            : R.append(value, cost),
                    };
                }),
            setCost: (costArray) => set({cost: costArray}),
            resetCost: () => set({cost: initialFilterState.cost}),

            // ORDER
            setOrder: (order) => set({order}),

            // RESET ALL
            resetFilters: () => set(initialFilterState),
        }),
        {
            name: 'filter-storage', // Clé localStorage
            getStorage: () => localStorage,
        }
    )
);
