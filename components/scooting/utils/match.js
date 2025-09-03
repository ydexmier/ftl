export const getStatusFromMatch = (match) => {
    if(match.games_drawn) return { label: "Draw", color: "primary" };
    const winningPlayerId = match.winning_player || null;
    if (!winningPlayerId) return {label: "Score not reported", color: "warning"};
    if (match.match_is_bye) return {label: "Bye", color: "secondary"};
    if (match.match_is_loss) return {label: "Loss", color: "error"};
    if (match.match_is_intentional_draw) return {label: "Intentional Draw", color: "primary"};
    if (match.match_is_unintentional_draw) return {label: "Unintentional Draw", color: "primary"};
    if (match.reports_are_in_conflict) return {label: "Conflict in reports", color: "error"};
    
    switch(match.status) {
        case "SCHEDULED":
            return {label: "Scheduled", color: "default"};
        case "IN_PROGRESS":             
            return {label:"In Progress", color: "info"};
        case "COMPLETE":
            return {label: "Completed", color: "success"};
        case "CANCELLED":
            return {label: "Cancelled", color: "error"};
        default:
            return {label: "Unknown status", color: "warning" };
    }
};

export const showScoreFromMatch = (match) => {
    if(match.games_drawn) return `${match.games_won_by_loser} - ${match.games_won_by_winner}`;
    const winningPlayerId = match.winning_player || null;
    if (!winningPlayerId) return "";
    if(winningPlayerId === match.player_match_relationships[0].player.id) {
        return `${match.games_won_by_winner} - ${match.games_won_by_loser}`;
    }
    return `${match.games_won_by_loser} - ${match.games_won_by_winner}`;
};