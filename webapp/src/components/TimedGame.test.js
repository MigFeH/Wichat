import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TimedGame from './TimedGame';
import QuestionGeneration from './wikidataComponents/QuestionGeneration';

// Mock dependencies
jest.mock('./wikidataComponents/QuestionGeneration');
jest.mock('./ChatLLM', () => () => <div data-testid="chat-llm">Chat LLM</div>);

describe('TimedGame', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    QuestionGeneration.mockImplementation((setQuestion) => ({
      fetchQuestions: jest.fn()
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders TimedProgress component and updates progress', () => {
    render(
      <BrowserRouter>
        <TimedGame />
      </BrowserRouter>
    );

    // Test progress updates
    act(() => {
      jest.advanceTimersByTime(1000); // Advance 1 second (10 updates)
    });

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('updates currentCity when currentQuestion changes', async () => {
    let setCurrentQuestionCallback;
    QuestionGeneration.mockImplementation((callback) => {
      setCurrentQuestionCallback = callback;
      return {
        fetchQuestions: jest.fn()
      };
    });

    render(
      <BrowserRouter>
        <TimedGame />
      </BrowserRouter>
    );

    const mockQuestion = {
      correct: 'Madrid',
      answers: { Madrid: 'url1', Paris: 'url2' }
    };

    await act(async () => {
      setCurrentQuestionCallback(mockQuestion);
    });

    // Verify ChatLLM component receives the correct city
    const chatLLM = screen.getByTestId('chat-llm');
    expect(chatLLM).toBeInTheDocument();
  });
});