import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, TextField, Button } from '@mui/material';
import axios from 'axios';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';
const apiKey = process.env.REACT_APP_LLM_API_KEY || 'None';

const ChatLLM = ({ currentCity }) => {
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const messageId = `msg-${Date.now()}-${chatHistory.length}`;
    const userMessage = { id: messageId, role: 'user', content: userInput };

    setChatHistory((prev) => [...prev, userMessage]);

    try {
      const response = await axios.post(`${apiEndpoint}/hintllm`, {
        question: `${currentCity || "ciudad desconocida"}:${userInput}`,
        model: 'gemini',
        apiKey: apiKey
      });

      const botMessage = { 
        id: `msg-${Date.now()}-${chatHistory.length + 1}`, 
        role: 'bot', 
        content: response.data.answer 
      };

      setChatHistory((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error obteniendo respuesta del LLM:', error);
      setChatHistory((prev) => [...prev, { 
        id: `msg-${Date.now()}-${chatHistory.length + 1}`, 
        role: 'bot', 
        content: 'Error al obtener respuesta.' 
      }]);
    }

    setUserInput('');
  };

  return (
    <Box sx={{ mt: 4, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
      <Typography variant="h6">Chat de Pistas</Typography>
      <Box sx={{ maxHeight: 200, overflowY: 'auto', p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
        {chatHistory.map((msg) => (
          <Typography 
            key={msg.id}
            sx={{ 
              textAlign: msg.role === 'user' ? 'right' : 'left', 
              color: msg.role === 'user' ? 'blue' : 'green' 
            }}
          >
            <strong>{msg.role === 'user' ? 'Tú' : 'LLM'}:</strong> {msg.content}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <TextField 
          fullWidth 
          label="Pregunta al LLM..." 
          variant="outlined" 
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSendMessage}
        >
          Enviar
        </Button>
      </Box>
    </Box>
  );
};

ChatLLM.propTypes = {
  currentCity: PropTypes.string
};

ChatLLM.defaultProps = {
  currentCity: ''
};

export default ChatLLM;
