export const getRoundName = (phase, round) => {
    switch(phase.round_type) {
        case "SWISS":
            return "Round " + round.round_number;
        case "ELIMINATION":
            return "Éliminatoire";
        case "RANKED_SINGLE_ELIMINATION":
            return 'Top '+ Math.pow(2, phase.rounds.length - phase.rounds.indexOf(round));
        case "FINAL":
            return "Finale";
        default:
            return "Inconnu";
    }
}