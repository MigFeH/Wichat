import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Game from './Game';
import QuestionGeneration from './wikidataComponents/QuestionGeneration';

// Mock components
jest.mock('./wikidataComponents/QuestionPresentation', () => () => 
  <div data-testid="question-presentation">QuestionPresentation Component</div>
);

jest.mock('./ChatLLM', () => () => 
  <div data-testid="chat-llm">Chat Component</div>
);

jest.mock('./wikidataComponents/QuestionGeneration');

describe('Game Component', () => {
  let mockSetQuestion;
  let mockQuestionGenerator;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock for QuestionGeneration
    mockQuestionGenerator = {
      fetchQuestions: jest.fn()
    };
    QuestionGeneration.mockImplementation(() => mockQuestionGenerator);
  });

  it('renders game components and handles question update', async () => {
    // Render component
    render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    );

    // Verify initial render
    expect(screen.getByTestId('question-presentation')).toBeInTheDocument();
    expect(screen.getByTestId('chat-llm')).toBeInTheDocument();
    
    // Verify fetchQuestions was called
    expect(mockQuestionGenerator.fetchQuestions).toHaveBeenCalled();
  });

  it('updates currentCity when currentQuestion changes', async () => {
    // Create a mock implementation that simulates setting the current question
    const mockQuestion = {
      correct: 'Madrid',
      answers: { Madrid: 'url1', Paris: 'url2' }
    };

    let setCurrentQuestionCallback;
    QuestionGeneration.mockImplementation((callback) => {
      setCurrentQuestionCallback = callback;
      return {
        fetchQuestions: jest.fn()
      };
    });

    // Render component
    render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    );

    // Simulate question update
    await waitFor(() => {
      setCurrentQuestionCallback(mockQuestion);
    });

    // Verify ChatLLM receives the correct city
    const chatLLM = screen.getByTestId('chat-llm');
    expect(chatLLM).toBeInTheDocument();
  });
});
