import { useState } from "react";
import Layout from '../components/Layout';
import { generateBoosters } from "../utils/boosterGenerator";
import Builder from '../components/builder/Builder';
import Tabs from '../components/Tabs';
import BoosterView from "../components/BoosterView";

export default function Scelle() {
  const [entries, setEntries] = useState([
    { id: 1, setNumber: "1", boosterCount: 10, cards: [], loading: false, error: null },
  ]);
  const [boosters, setBoosters] = useState([]);

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      {
        id: prev.length > 0 ? prev[prev.length - 1].id + 1 : 1,
        setNumber: "1",
        boosterCount: 1,
        cards: [],
        loading: false,
        error: null,
      },
    ]);
  };

  const removeEntry = (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEntry = (id, key, value) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [key]: value } : e))
    );
  };

  const generateAllBoosters = async () => {
    setBoosters([]);
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

        {boosters.length > 0 && <div style={{ marginTop: 30 }}>
          <Tabs tabs={[{
            label: "Ouverture du scellé", disabled: boosters.length < 1, component: (
              <>
                {boosters.length > 0 && boosters.map((booster, i) => (
                  <div key={i} style={{ marginBottom: 15 }}>
                    <BoosterView title={`Booster #${i + 1}`} booster={booster} />
                  </div>
                ))}
              </>
            )
          }, {
            label: "Builder du scellé", disabled: boosters.length < 1, component: (
              boosters.length > 0 && <Builder cards={boosters.flat()} />
            )
          }, { label: "Statistique du scellé", component: <div>On affichera pleins de stats</div> }]} />

        </div>}
      </div>
    </Layout>
  );
}
