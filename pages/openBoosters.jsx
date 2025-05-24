import { useState } from "react";
import Layout from '../components/Layout';
import { generateBoosters } from "../utils/boosterGenerator";
import Builder from '../components/builder/Builder';
import Tabs from '../components/Tabs';
import BoosterView from "../components/BoosterView";
import SetsSelector from "../components/SetsSelector";
import { useSelectedCardsStore } from '../components/stores/useSelectedCardsStore';

export default function OpenBoosters() {
  const boosterCards = useSelectedCardsStore(state => state.boosterCards);
  const setBoosterCards = useSelectedCardsStore(state => state.setBoosterCards);
  const clearBoosterCards = useSelectedCardsStore(state => state.clearBoosterCards);
  const setBuilderCards = useSelectedCardsStore(state => state.setBuilderCards);

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
    setBuilderCards(allBoosters.flat())
  };


  return (
    <Layout>
      <div>
        <h1>Multi Set Booster Generator</h1>

        <SetsSelector onClick={generateAllBoosters} />
        {boosterCards.length > 0 && boosterCards.map((booster, i) => (
          <div key={i} style={{ marginBottom: 15 }}>
            <BoosterView booster={booster} title={`Booster #${i + 1}`} />
          </div>
        ))}
      </div>
    </Layout>
  );
}
