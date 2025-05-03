import React from 'react';
import { Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import QuestionPresentation from './wikidataComponents/QuestionPresentation.jsx';
import useGameLogic from './utils/GameUtils';
import ChatLLM from './ChatLLM';

const Game = () => {
  const navigate = useNavigate();

  const { currentQuestion, questionGenerator, currentCity, chatRef } = useGameLogic();

  const chatComponent = <ChatLLM ref={chatRef} currentCity={currentCity} data-testid="chat-llm" />;

  return (
    <Container component="main" maxWidth="md" sx={{ marginTop: 4 }}>
      <QuestionPresentation 
        game={questionGenerator}
        navigate={navigate}
        question={currentQuestion}
        chatComponent={chatComponent}
        data-testid="question-presentation"
      />
    </Container>
  );
};

export default Game;
