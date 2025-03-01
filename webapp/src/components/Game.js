import React, { useEffect } from 'react';
import { Container, Typography } from '@mui/material';
import '../Wikidata/wikidataPresentation/estilo.css';

const Game = () => {
  useEffect(() => {
    // Importa y ejecuta el script de presentación de preguntas
    import('../Wikidata/wikidataPresentation/QuestionPresentation.js');
  }, []);

  return (
    <Container component="main" maxWidth="md" sx={{ marginTop: 4 }}>
      <Typography component="h1" variant="h4">
        Welcome to the Game Page
      </Typography>
      <Typography component="p" variant="body1" sx={{ marginTop: 2 }}>
        Here you can start playing the game.
      </Typography>
      {/* El contenido del script se ejecutará aquí */}
    </Container>
  );
};

export default Game;