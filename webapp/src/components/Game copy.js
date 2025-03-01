import React, { useEffect, useRef } from 'react';
import { Container, Typography } from '@mui/material';
import '../wikidata/wikidataPresentation/estilo.css';
import QuestionPresentation from '../wikidata/QuestionPresentation.js';

const Game = () => {
  const quizContainerRef = useRef(null);

  useEffect(() => {
    // Instancia y ejecuta el script de presentación de preguntas
    if (quizContainerRef.current) {
      new QuestionPresentation(quizContainerRef.current);
    }
  }, []);

  return (
    <Container component="main" maxWidth="md" sx={{ marginTop: 4 }}>
      <Typography component="h1" variant="h4">
        Welcome to the Game Page
      </Typography>
      <div ref={quizContainerRef}></div> {/* Contenedor para el juego */}
    </Container>
  );
};

export default Game;