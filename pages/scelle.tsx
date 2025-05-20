import { useState } from "react";
import Layout from '../components/Layout';

import { generateBoosters } from "../utils/boosterGenerator";
import styled from '@emotion/styled';
import Card from '../components/card';


const GridCards = styled.div`
display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 12px;
`;

type Entry = {
  id: number;
  setNumber: string;
  boosterCount: number;
  cards: any[]; // cartes chargées pour ce set
  loading: boolean;
  error: string | null;
};

export default function Scelle() {
  const [entries, setEntries] = useState<Entry[]>([
    { id: 1, setNumber: "", boosterCount: 1, cards: [], loading: false, error: null },
  ]);
  const [boosters, setBoosters] = useState<any[][]>([]);

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      {
        id: prev.length > 0 ? prev[prev.length - 1].id + 1 : 1,
        setNumber: "",
        boosterCount: 1,
        cards: [],
        loading: false,
        error: null,
      },
    ]);
  };

  const removeEntry = (id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEntry = (id: number, key: keyof Entry, value: any) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [key]: value } : e))
    );
  };

  const loadSet = async (id: number, setNumber: string) => {
    if (!setNumber) return;
    updateEntry(id, "loading", true);
    updateEntry(id, "error", null);
    updateEntry(id, "cards", []);

    try {
      const res = await fetch(`/json/sets/${setNumber}.json`);
      if (!res.ok) throw new Error("Fichier non trouvé");
      const data = await res.json();
      updateEntry(id, "cards", data);
    } catch (e) {
      updateEntry(id, "error", "Erreur lors du chargement");
    } finally {
      updateEntry(id, "loading", false);
    }
  };

  const generateAllBoosters = async () => {
  let allBoosters: any[][] = [];

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

  setBoosters(allBoosters);
};


  return (
<Layout>
    <div>
      <h1>Multi Set Booster Generator</h1>

      {entries.map(({ id, setNumber, boosterCount, loading, error }) => (
        <div
          key={id}
          style={{ marginBottom: 20, padding: 10, border: "1px solid #ccc" }}
        >
          <label>
            Numéro du set:
            <input
              type="text"
              value={setNumber}
              onChange={(e) => updateEntry(id, "setNumber", e.target.value)}
              placeholder="Ex: 1"
            />
          </label>

          <label style={{ marginLeft: 10 }}>
            Nombre de boosters:
            <input
              type="number"
              min={1}
              value={boosterCount}
              onChange={(e) =>
                updateEntry(id, "boosterCount", Number(e.target.value))
              }
              style={{ width: 60 }}
            />
          </label>

          <button
            style={{ marginLeft: 10 }}
            onClick={() => removeEntry(id)}
            disabled={entries.length === 1}
            title="Supprimer cette ligne"
          >
            ×
          </button>

          {error && <div style={{ color: "red" }}>{error}</div>}
        </div>
      ))}

      <button onClick={addEntry}>Ajouter un set</button>

      <hr />

      <button onClick={generateAllBoosters}>Générer tous les boosters</button>

      <div style={{ marginTop: 30 }}>
        {boosters.length > 0 && (
          <>
            <h2>Résultats</h2>
            {boosters.map((booster, i) => (
              <div key={i} style={{ marginBottom: 15 }}>
                <h3>Booster #{i + 1}</h3>
                <GridCards>
                  {booster.map((card) => (
                      <Card key={`booster${i}-${card.id}`} data={card}/>
                  ))}
                </GridCards>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
</Layout>
  );
}
