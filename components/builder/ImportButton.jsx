import React, { useState } from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import allCards from '../../public/json/sets/allCards.json';
import { useSelectedCardsStore } from '../stores/useSelectedCardsStore';

const ImportButton = () => {
    const [open, setOpen] = useState(false);
    const [textValue, setTextValue] = useState('');
    const setBuilderCards = useSelectedCardsStore(state => state.setBuilderCards);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setTextValue('');
        setOpen(false);
    };

    const parseImportedText = (text, referenceData) => {
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const result = [];

        lines.forEach(line => {
            const match = line.match(/^(\d+)\s+(.*?)(?:\s*-\s*(.*))?$/);
            if (match) {
                const quantity = parseInt(match[1], 10);
                const name = match[2].trim();
                const version = match[3]?.trim() || null;

                // Cherche dans le JSON par name et version
                const matchedCard = referenceData.find(
                    card =>
                        card.name === name &&
                        (version ? card.version === version : true)
                );

                if (matchedCard) {
                    console.log(quantity)
                    result.push({ ...matchedCard, quantity });
                } else {
                    console.warn(`Carte non trouvée : ${name} - ${version}`);
                }
            } else {
                console.warn(`Ligne ignorée (format invalide) : ${line}`);
            }
        });
        setBuilderCards(result)
        return result;
    };

    const handleValidate = () => {
        const parsedCards = parseImportedText(textValue, allCards);
        handleClose();
    };

    return (
        <div>
            <Button variant="contained" color="primary" onClick={handleOpen}>
                Importer une collection
            </Button>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Importer du texte</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Coller votre texte ici"
                        type="text"
                        fullWidth
                        multiline
                        rows={6}
                        variant="outlined"
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="secondary">
                        Annuler
                    </Button>
                    <Button onClick={handleValidate} color="primary" variant="contained">
                        Valider
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default ImportButton;
