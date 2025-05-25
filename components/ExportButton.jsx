import React, { useState } from 'react';
import Button from '@mui/material/Button';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Modal, Box, TextareaAutosize as TextareaAutosizeComponent } from '@mui/material';
import styled from '@emotion/styled';

const TextareaAutosize = styled(TextareaAutosizeComponent)`
    resize: vertical;
    width: 100%;
`;

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    pt: 2,
    px: 4,
    pb: 3,
};

const ExportButton = ({ cards, buttonLabel }) => {
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [buttonText, setButtonText] = useState(buttonLabel);
    const onCopy = () => {
        navigator.clipboard.writeText(cards)
            .then(() => {
                setButtonText('Texte copié dans le presse-papier !');
            })
            .catch(err => {
                setButtonText('Erreur lors de la copie !');
                console.error(err);
            });
    }
    return <>
        <Button variant="contained" onClick={handleOpen}>{buttonText}</Button>
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="parent-modal-title"
            aria-describedby="parent-modal-description"
        >
            <Box sx={{ ...style }}>
                <Box>
                    <h2 id="parent-modal-title">Copier la liste de cartes</h2>
                    <TextareaAutosize maxRows={10} defaultValue={cards} />
                </Box>
                <Button sx={{ mt: 2 }} onClick={onCopy} variant="contained" endIcon={<ContentCopyIcon />}>Dreamborn</Button>
            </Box>
        </Modal>
    </>
}

export default ExportButton;