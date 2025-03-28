import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatLLM from './ChatLLM';
import axios from 'axios';

jest.mock('axios');

describe('ChatLLM Component', () => {
  it('renders correctly', () => {
    render(<ChatLLM currentCity="Madrid" />);
    expect(screen.getByText('Chat de Pistas')).toBeInTheDocument();
    expect(screen.getByLabelText('Pregunta al LLM...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });

  it('sends a message and receives a response', async () => {
    axios.post.mockResolvedValueOnce({ data: { answer: 'Esta es una pista sobre Madrid' } });
    
    render(<ChatLLM currentCity="Madrid" />);

    const input = screen.getByLabelText('Pregunta al LLM...');
    const sendButton = screen.getByRole('button', { name: /enviar/i });
    
    fireEvent.change(input, { target: { value: 'Dame una pista' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => expect(screen.getByText('Tú: Dame una pista')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('LLM: Esta es una pista sobre Madrid')).toBeInTheDocument());
  });
});
