import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TimedQuestionPresentation from './wikidataComponents/TimedQuestionPresentation.jsx';
import QuestionGeneration from "./wikidataComponents/QuestionGeneration.js";
import ChatLLM from "./ChatLLM";


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

const TimedGame = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionGenerator] = useState(() => new QuestionGeneration(setCurrentQuestion));
  const [currentCity, setCurrentCity] = useState(null);

    useEffect(() => {
        questionGenerator.fetchQuestions();
    }, [questionGenerator]);

    useEffect(() => {
        if (currentQuestion) {
            setCurrentCity(currentQuestion.correct); // ← Guarda la ciudad actual basada en la pregunta
        }
    }, [currentQuestion]);

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

        <ChatLLM currentCity={currentCity} />
    </Container>
  );
};

export default TimedGame;