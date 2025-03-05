import React, { useEffect, useRef } from 'react';
import { Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import '../wikidata/estilo.css';
import QuestionPresentation from '../wikidata/QuestionPresentation.js';

const Game = () => {
  const quizContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Instancia y ejecuta el script de presentación de preguntas
    if (quizContainerRef.current) {
      new QuestionPresentation(quizContainerRef.current, navigate);
    }
  }, [navigate]);

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