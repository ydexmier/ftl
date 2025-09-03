import React, { useState, useEffect } from "react";
import { Grid, Link, Modal } from "@mui/material";
import { useRouter } from "next/router";

import { useFetch } from "../hooks/useFetch";
import MatchCard from "./MatchCard";
import MatchModal from "./MatchModal";
import { get, set } from "mongoose";

const Round = (props) => {
    const [matchToShow, setMatchToShow] = useState(null);
    const router = useRouter();
    const { tournamentId } = router.query;
    const { roundId } = props;
    const { data, loading, error } = useFetch(`/api/rounds/${roundId}/matchs`);
    const [matchs, setMatchs] = useState([]);
    const [playersDecks, setPlayersDecks] = useState([]); // { playerId: [decks] }

    useEffect(() => {
        if (data) {
            setMatchs(data.results || []);
            setPlayersDecks(data.playersDecks.players || []); // initialiser playersDecks
        }
    }, [data]);

    const closeMatchModal = () => setMatchToShow(null);
    const openMatchModal = (match) => () => setMatchToShow(match);
    const onValidateAssignDeck = (datas) => {
        // Here you can call an API to save the assigned deck to the match
        fetch(`/api/rounds/${roundId}/matchs/${matchToShow.id}/assign_deck`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                decks: [datas.combination1, datas.combination2],
            }),
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }).then(data => {
            // Close the modal after successful assignment
            setMatchs(data.matchs || []); // mettre à jour les matchs si nécessaire
            setPlayersDecks(data.playersDecks || []); // mettre à jour playersDecks si nécessaire
            closeMatchModal();
        })
        .catch((error) => {
            console.error('Error:', error);
            // You might want to show an error message to the user here
        });
        // Re-fetch the matchs to get the updated data
        // This is a simple way to do it, but you might want to use a more sophisticated state management solution
        // like React Query or SWR for better performance and user experience
        setMatchToShow(null);
    }
    const getPlayerDecksInk = (playerId) => {
        const player = playersDecks.find(p => p.id === playerId);
        
        return player ? player[player.status] || [] : [];
    }
    const getMatchPlayerInks = (match) => {
        const matchPlayerInks = match.player_match_relationships.reduce((acc,pmr) => {
            const hasPlayerCombinations = playersDecks.find(p => p.id === pmr.player.id);
            if (!hasPlayerCombinations) return acc;
            acc.push({
                playerId: pmr.player.id,
                inks: [...new Set(getPlayerDecksInk(pmr.player.id).flatMap(item => item.inks))]
            });
            return acc
        }, []);
        return matchPlayerInks.length ? matchPlayerInks : undefined;
    }

    if (loading) return <div>Loading matchs...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!matchs || matchs.length === 0) return <div>No matchs found.</div>;
    return (
        <>
            <div>
                <h2>Round</h2>
                <Grid container spacing={2} sx={{
                    justifyContent: "space-between",
                    alignItems: "stretch",
                }}>
                    {matchs.map((match) => (
                        <Grid sx={{ display: "flex" }} item onClick={openMatchModal(match)} key={match.id} size={4}>
                            <MatchCard 
                                sx={{ flexGrow: 1 }}
                                player1Deck={getPlayerDecksInk(match.player_match_relationships.find(p => p.player_order === 1).player.id)}
                                player2Deck={getPlayerDecksInk(match.player_match_relationships.find(p => p.player_order === 2).player.id)}
                                match={match}
                            />
                        </Grid>
                    ))}
                </Grid>
            </div>
            <MatchModal
                match={matchToShow}
                open={!!matchToShow}
                combinationsInitial={matchToShow && getMatchPlayerInks(matchToShow)}
                onValidate={onValidateAssignDeck}
                onClose={closeMatchModal}
                aria-labelledby="match-modal-title"
                aria-describedby="match-modal-description"
            />
        </>
        
    );
}

export default Round;