// stores/useSelectedCardsStore.js
import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import * as R from 'ramda';

const inkOrder = ['Amber', 'Amethyst', 'Emerald', 'Ruby', 'Sapphire', 'Steel'];

const sortByInkOrder = R.sortWith([
    R.descend(R.prop('quantity')),
    R.ascend((item) => inkOrder.indexOf(item.ink)),
]);

const mergedCards = (cards) =>
    Object.values(
        cards.reduce((acc, card) => {
            const key = card.id;
            if (!acc[key]) {
                acc[key] = {...card, quantity: 1};
            } else {
                acc[key].quantity += 1;
            }
            return acc;
        }, {})
    );

export const useSelectedCardsStore = create(
    persist(
        (set, get) => ({
            // Cartes sélectionnées avec quantité
            builderCards: [],

            // Liste des boosters (tableau de tableaux de cartes)
            boosterCards: [],
            setBuilderCards: (cards) => {
                return set({builderCards: sortByInkOrder(mergedCards(cards))});
            },

            setCardQuantity: (cardId, quantity) => {
                if (quantity >= 0) {
                    set((state) => ({
                        builderCards: state.builderCards.map((c) =>
                            c.id === cardId
                                ? {
                                      ...c,
                                      quantitySelected:
                                          quantity <= c.quantity
                                              ? quantity
                                              : quantitySelected,
                                  }
                                : c
                        ),
                    }));
                }
            },

            clearCards: () => set({selectedCards: []}),

            // ==== BOOSTERS ====

            setBoosterCards: (boosters) => set({boosterCards: boosters}),

            addBooster: (booster) =>
                set((state) => ({
                    boosterCards: [...state.boosterCards, booster],
                })),

            clearBoosterCards: () => set({boosterCards: []}),
        }),
        {
            name: 'selected-cards-storage',
        }
    )
);
