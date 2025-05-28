import React, { useState, useRef } from 'react';
import Button from '@mui/material/Button';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Modal, Box, TextareaAutosize as TextareaAutosizeComponent, Grid, Snackbar, IconButton } from '@mui/material';
import styled from '@emotion/styled';
import { exportCardsCSV, exportCards } from '../utils/exportCards';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';

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

const ExportButton = ({ cards, buttonLabel, noCSV = false, variant = "contained" }) => {
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [snackbarText, setSnackbarText] = useState('');
    const textareaRef = useRef();
    const onCopy = () => {
        navigator.clipboard.writeText(textareaRef.current.value)
            .then(() => {
                setSnackbarText('Texte copié dans le presse-papier !');
            })
            .catch(err => {
                setSnackbarText('Erreur lors de la copie !');
                console.error(err);
            });
    }

    const onDownloadCSV = () => {
        exportCardsCSV(cards);
        setSnackbarText('.csv généré');
    }

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setSnackbarText('');
    };
    return <>
        <Button variant={variant} onClick={handleOpen}>{buttonLabel}</Button>
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="parent-modal-title"
            aria-describedby="parent-modal-description"
        >
            <Box sx={{ ...style }}>
                <Box>
                    <h2 id="parent-modal-title">Copier la liste de cartes</h2>
                    <TextareaAutosize ref={textareaRef} maxRows={10} defaultValue={exportCards(cards)} />
                </Box>
                <Grid container spacing={2} justifyContent="space-between" alignItems="center">
                    <Button sx={{ mt: 2 }} onClick={onCopy} variant="contained" endIcon={<ContentCopyIcon />}>TXT</Button>
                    {!noCSV && <Button sx={{ mt: 2 }} onClick={onDownloadCSV} variant="contained" endIcon={<DownloadIcon />}>.CSV</Button>}
                </Grid>
            </Box>
        </Modal>
        <Snackbar
            open={!!snackbarText}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            message={snackbarText}
            action={<IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleCloseSnackbar}
            >
                <CloseIcon fontSize="small" />
            </IconButton>}
        />
    </>
}

export default ExportButton;