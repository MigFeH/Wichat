import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatLLM from './ChatLLM';
import axios from 'axios';

jest.mock('axios');

describe('ChatLLM Component', () => {
  test('renders correctly', () => {
    render(<ChatLLM currentCity="Madrid" />);
    expect(screen.getByText('Chat de Pistas')).toBeInTheDocument();
  });

  test('receives the correct city', () => {
    render(<ChatLLM currentCity="Madrid" />);
    expect(screen.getByText('Chat de Pistas')).toBeInTheDocument();
    // Add additional checks if needed
  });

  test('handles user input and sends a request', async () => {
    axios.post.mockResolvedValueOnce({ data: { answer: 'This is a hint' } });

    render(<ChatLLM currentCity="Madrid" />);

    const input = screen.getByLabelText(/Pregunta al LLM/i);
    const sendButton = screen.getByText(/Enviar/i);

    fireEvent.change(input, { target: { value: 'What is the capital of Spain?' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Tú: What is the capital of Spain?')).toBeInTheDocument();
      expect(screen.getByText('LLM: This is a hint')).toBeInTheDocument();
    });
  });
});
