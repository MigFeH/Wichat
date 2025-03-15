import React, { useState, useEffect } from 'react';
import { Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import QuestionPresentation from './wikidataComponents/QuestionPresentation.jsx';
import QuestionGeneration from "./wikidataComponents/QuestionGeneration.js";

const Game = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionGenerator] = useState(() => new QuestionGeneration(setCurrentQuestion));

  useEffect(() => {
    questionGenerator.fetchQuestions();
  }, [questionGenerator]);

  return (
    <Container component="main" maxWidth="md" sx={{ marginTop: 4 }}>
      <Typography component="h1" variant="h4">
        Welcome to the Game Page
      </Typography>
      <QuestionPresentation 
        game={questionGenerator}
        navigate={navigate}
        question={currentQuestion}
      />
    </Container>
  );
};

export default Game;