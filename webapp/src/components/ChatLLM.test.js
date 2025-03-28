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
});
