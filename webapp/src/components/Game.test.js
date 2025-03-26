import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Game from './Game';
import QuestionGeneration from './wikidataComponents/QuestionGeneration.js';

// Mock components
jest.mock('./wikidataComponents/QuestionPresentation.jsx', () => () => 
  <div>QuestionPresentation Component</div>
);

jest.mock('./wikidataComponents/QuestionGeneration.js');
jest.mock('./ChatLLM', () => () => 
  <div>Chat Component</div>
);

describe('Game Component', () => {
  beforeEach(() => {
    // Create mock for fetchQuestions
    const mockFetchQuestions = jest.fn().mockResolvedValue();
    QuestionGeneration.mockImplementation( () => ({ fetchQuestions: mockFetchQuestions }) );
  });

  it('renders game component correctly', async () => {
    render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('QuestionPresentation Component')).toBeInTheDocument();
    });
  });
});
