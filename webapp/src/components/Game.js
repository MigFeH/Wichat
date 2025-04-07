import React, { useRef } from 'react';
import { Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import QuestionPresentation from './wikidataComponents/QuestionPresentation.jsx';
import useGameLogic from './utils/GameUtils';
import ChatLLM from './ChatLLM';

const Game = () => {
  const navigate = useNavigate();
  const chatRef = useRef(); // Crear una referencia para ChatLLM

  // Pasar showChat al hook useGameLogic
  const { currentQuestion, questionGenerator, currentCity } = useGameLogic(() => {
    chatRef.current?.showChat(); // Llamar a showChat desde la referencia
  });

  return (
    <Container component="main" maxWidth="md" sx={{ marginTop: 4 }}>
      <QuestionPresentation 
        game={questionGenerator}
        navigate={navigate}
        question={currentQuestion}
        data-testid="question-presentation"
      />

      <ChatLLM 
        ref={chatRef} // Pasar la referencia al componente ChatLLM
        currentCity={currentCity} 
        data-testid="chat-llm"
      />
    </Container>
  );
};

export default Game;
