import React from "react";
import Layout from '../components/Layout';
import { generateBoosters } from "../utils/boosterGenerator";
import { exportCards } from '../utils/exportCards';

import BoosterView from "../components/BoosterView";
import SetsSelector from "../components/SetsSelector";
import { useSelectedCardsStore } from '../components/stores/useSelectedCardsStore';
import { Button, Grid } from "@mui/material";

const mergedCards = (cards) =>
    Object.values(
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

export default function OpenBoosters() {
    const boosterCards = useSelectedCardsStore(state => state.boosterCards);
    const builderCards = useSelectedCardsStore(state => state.builderCards);
    const setBoosterCards = useSelectedCardsStore(state => state.setBoosterCards);
    const clearBoosterCards = useSelectedCardsStore(state => state.clearBoosterCards);
    const setBuilderCards = useSelectedCardsStore(state => state.setBuilderCards);

    const generateWorldScelle = async () => {
        generateAllBoosters([
            { setNumber: 5, boosterCount: 4 },
            { setNumber: 6, boosterCount: 4 },
            { setNumber: 7, boosterCount: 4 },
            { setNumber: 8, boosterCount: 4 },
        ])
    }

    const generateAllBoosters = async (entries) => {
        clearBoosterCards();
        let allBoosters = [];

        for (const entry of entries) {
            const { setNumber, boosterCount } = entry;

            if (!setNumber || boosterCount <= 0) {
                alert(`Entrée invalide : set ${setNumber}`);
                return;
            }

            try {
                const res = await fetch(`/json/sets/${setNumber}.json`);
                if (!res.ok) throw new Error(`Set ${setNumber} introuvable`);
                const data = await res.json();

                const boostersFromSet = generateBoosters(data, boosterCount);
                allBoosters = [...allBoosters, ...boostersFromSet];
            } catch (e) {
                alert(`Erreur avec le set ${setNumber}: ${e}`);
                return;
            }
        }

        setBoosterCards(allBoosters);
        setBuilderCards(mergedCards(allBoosters.flat()))
    };


    return (
        <Layout>
            <div>
                <Grid container sx={{
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                    <h1>Multi Set Booster Generator</h1>
                    <Button onClick={generateWorldScelle}>Génerer Format World</Button>
                </Grid>
                <Grid>
                    <SetsSelector onClick={generateAllBoosters} cards={exportCards(builderCards)} />
                </Grid>
                {boosterCards.length > 0 && boosterCards.map((booster, i) => (
                    <div key={i} style={{ marginBottom: 15 }}>
                        <BoosterView booster={booster} title={`Booster #${i + 1}`} />
                    </div>
                ))}
            </div>
        </Layout>
    );
}
