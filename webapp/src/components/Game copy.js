import React from 'react';
import { Container, Typography } from '@mui/material';

const Game = () => {
  return (
    <Container component="main" maxWidth="md" sx={{ marginTop: 4 }}>
      <Typography component="h1" variant="h4">
        Welcome to the Game Page
      </Typography>
      <Typography component="p" variant="body1" sx={{ marginTop: 2 }}>
        Here you can start playing the game.
      </Typography>
    </Container>
  );
};

export default Game;