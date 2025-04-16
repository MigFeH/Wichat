import React from 'react';
import { Container } from '@mui/material';

import LocationGuesser from './wikidataComponents/LocationGuesser.jsx';
import ChatLLM from "./ChatLLM";


const LocationGame = () => {
  return (
    <Container component="main" maxWidth="md" sx={{ marginTop: 4 }}>
      <LocationGuesser/>

        <ChatLLM
            currentCity={currentCity}
            data-testid="chat-llm"
        />
    </Container>
  );
};

export default LocationGame;
