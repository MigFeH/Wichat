import React from 'react';
import { Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TimedQuestionPresentation from './wikidataComponents/TimedQuestionPresentation.jsx';
import useGameLogic from './utils/GameUtils';
import ChatLLM from './ChatLLM';

const TimedGame = () => {
    const navigate = useNavigate();
    const { currentQuestion, questionGenerator, currentCity } = useGameLogic();

    return (
        <Container component="main" maxWidth="md" sx={{ marginTop: 4 }}>
            <TimedQuestionPresentation 
                game={questionGenerator}
                navigate={navigate}
                question={currentQuestion}
                data-testid="timed-question-presentation"
            />
            <ChatLLM currentCity={currentCity} data-testid="chat-llm" />
        </Container>
    );
};

export default TimedGame;