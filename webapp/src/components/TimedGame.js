import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TimedQuestionPresentation from './wikidataComponents/QuestionPresentation.jsx';
import QuestionGeneration from "./wikidataComponents/QuestionGeneration.js";


const TimedProgress = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((oldProgress) => {
                const newProgress = oldProgress + 1;
                return newProgress >= 100 ? 100 : newProgress;
            });
        }, 100); // Se incrementa 1% cada 100ms → 10 segundos en total

        return () => clearInterval(interval);
    }, []);

    return <CircularProgress variant="determinate" value={progress} />;
};

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
      <TimedQuestionPresentation
        timedGame={questionGenerator}
        navigate={navigate}
        question={currentQuestion}
      />
        {TimedProgress}
    </Container>
  );
};

export default Game;