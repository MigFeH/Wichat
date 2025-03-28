import React from 'react';
import { Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import QuestionPresentation from './wikidataComponents/QuestionPresentation.jsx';
import useGameLogic from './utils/GameUtils';
import ChatLLM from './ChatLLM';

const Game = () => {
  const navigate = useNavigate();
  const { currentQuestion, questionGenerator, currentCity } = useGameLogic();

  return (
    <Container component="main" maxWidth="md" sx={{ marginTop: 4 }}>
      <QuestionPresentation 
        game={questionGenerator}
        navigate={navigate}
        question={currentQuestion}
        data-testid="question-presentation"
      />

      <ChatLLM 
        currentCity={currentCity} 
        data-testid="chat-llm"
      />

    </Container>
  );
};

export default Game;
