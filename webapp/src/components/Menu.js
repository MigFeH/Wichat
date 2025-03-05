import React from 'react';
import { Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Menu = () => {
    const navigate = useNavigate();

    const handlePageChange = (page) => () => {
        navigate(`/${page}`);
    }

    return (
        <Container component="main" maxWidth="md" sx={{ marginTop: 4 }}>
            <Typography component="h1" variant="h4">
                Welcome to the principal page
            </Typography>
            
            <Typography component="p" variant="body1" sx={{ marginTop: 2 }}>
                Press start to play.
            </Typography>

            <Button variant="contained" color="primary" onClick={handlePageChange("game")}>
                Start
            </Button>

            <Button variant="contained" color="primary" onClick={handlePageChange("stadistics")}>
                Stadistics
            </Button>
        </Container>
    );
};

export default Menu;