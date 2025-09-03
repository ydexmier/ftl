// ftl/components/scooting/components/Tournament.jsx
import React, {useState} from "react";
import { useFetch } from "../hooks/useFetch";
import Round from "./Round";

const getPhaseType = (round_type) => {
    switch(round_type) {
        case "SWISS":
            return "Round";
        case "ELIMINATION":
            return "Éliminatoire";
        case "FINAL":
            return "Finale";
        default:
            return "Inconnu";
    }
}
export default function Tournament(props) {
  const { id } = props; // récupère l'id de l'URL
  const [roundId, setRoundId] = useState(null);
    const { data: tournament, loading, error } = useFetch(`/api/tournaments/${id}`);

    const handlePhaseChange = (event) => {
        const selectedRoundId = event.target.value;
        setRoundId(selectedRoundId);
    };
    if (loading) return <div>Loading tournament...</div>;
  return (
    <div>
      <h1>Tournament {id}</h1>
      <p>Nombre de joueur: {tournament.registered_user_count}</p>
      <select onChange={handlePhaseChange} name="phases" id="phases">
        <option value="">--Please choose a phase--</option>
        {tournament.tournament_phases.map((phase) => (
            phase.rounds.map((round) => (
                <option  key={round.id} value={round.id}>{getPhaseType(phase.round_type) + " " + round.round_number}</option>
            ))
        ))}
        
        </select>
        {roundId && <Round roundId={roundId} />}
    </div>
  );
}
