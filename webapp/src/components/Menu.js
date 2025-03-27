import React from 'react';
import { Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import '../components/style/Home.css';

const Menu = () => {
    const navigate = useNavigate();

    const handlePageChange = (page) => () => {
        navigate(`/${page}`);
    }

    return (
        <Container component="main" maxWidth="md" sx={{ marginTop: 4 }}>
            <Typography component="h1" variant="h4">
                Hey!! Are you ready? 🌊
            </Typography>
            
            <Typography component="p" variant="body1" sx={{ marginTop: 2 }}>
                Select a game to play!
            </Typography>

            <Button variant="contained" color="primary" onClick={handlePageChange("game")}>
                Non Timed game!
            </Button>

            <Button variant="contained" color="primary" onClick={handlePageChange("timedGame")}>
                Timed game!
            </Button>

            <Button variant="contained" color="primary" onClick={handlePageChange("stadistics")}>
                Stadistics
            </Button>

            <Button variant="contained" color="primary" onClick={handlePageChange("ranking")}>
                Ranking
            </Button>

            <audio id="wave-sound" src="/olas-del-mar.mp3" autoPlay loop></audio>
            <div className="wave-container">
                <svg className="wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path fill="#0099ff" fillOpacity="1" d="M0,96L40,101.3C80,107,160,117,240,101.3C320,85,400,43,480,32C560,21,640,43,720,58.7C800,75,880,85,960,80C1040,75,1120,53,1200,53.3C1280,53,1360,75,1400,85.3L1440,96L1440,320L1400,320C1360,320,1280,320,1200,320C1120,320,1040,320,960,320C880,320,800,320,720,320C640,320,560,320,480,320C400,320,320,320,240,320C160,320,80,320,40,320L0,320Z"></path>
                </svg>
            </div>
        </Container>
    );
};

export default Menu;