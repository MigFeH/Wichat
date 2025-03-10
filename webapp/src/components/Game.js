import React, { useEffect, useRef } from 'react';
import { Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './wikidataComponents/estilo.css';
import QuestionPresentation from './wikidataComponents/QuestionPresentation.jsx';
import QuestionGeneration from "./wikidataComponents/QuestionGeneration.js";

const Game = () => {
  const quizContainerRef = useRef(null);
  const navigate = useNavigate();
  const gen = new QuestionGeneration();

  useEffect(() => {
    // Instancia y ejecuta el script de presentación de preguntas
    if (quizContainerRef.current) {
        new QuestionPresentation({gen,navigate});
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