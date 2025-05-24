import React, { useState } from 'react';
import { useRouter } from 'next/router';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';

const SetsSelector = ({ onClick }) => {
    const router = useRouter();
    const goToBuilder = () => {
        router.push('/builder');
    };
    const [entries, setEntries] = useState([
        { id: 1, setNumber: "1", boosterCount: 10, cards: [], loading: false, error: null },
    ]);

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
    return <Grid container spacing={2} direction="column">
        {entries.map(({ id, setNumber, boosterCount, loading, error }, index) => (
            <> <Grid
                key={id}
                container
                direction="row"
                sx={{
                    alignItems: "center",
                }}
                spacing={2}
            >
                <TextField
                    sx={{ mr: 2 }}
                    label="Numéro du set:"
                    type="number"
                    value={setNumber}
                    onChange={(e) => updateEntry(id, "setNumber", e.target.value)}
                    placeholder="Ex: 1"
                    slotProps={{
                        inputLabel: {
                            shrink: true,
                        },
                    }}
                />
                <TextField
                    label=" Nombre de boosters:"
                    type="number"
                    min={1}
                    value={boosterCount}
                    onChange={(e) =>
                        updateEntry(id, "boosterCount", Number(e.target.value))
                    }
                    slotProps={{
                        inputLabel: {
                            shrink: true,
                        },
                    }}
                />
                <IconButton disabled={entries.length === 1} onClick={() => removeEntry(id)} aria-label="remove">
                    <DeleteOutlineIcon />
                </IconButton>


                {error && <div style={{ color: "red" }}>{error}</div>}
            </Grid>
                {index === entries.length - 1 && <Divider textAlign="left" ><Button onClick={addEntry} variant="outlined">Ajouter un set</Button></Divider>}
            </>
        ))}
        <Grid container spacing={2}>
            <Button onClick={() => onClick(entries)} variant="contained">
                Générer tous les boosters
            </Button>
            <Button variant="contained" onClick={goToBuilder} endIcon={<SendIcon />}>
                Builder avec ces boosters
            </Button>
        </Grid>
    </Grid >
}

export default SetsSelector;