import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Game from './Game';
import QuestionGeneration from './wikidataComponents/QuestionGeneration';

// filepath: c:\Local\ASW\wichat_es2b\wichat_es2b\webapp\src\components\Game.test.js

jest.mock('./wikidataComponents/QuestionGeneration');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe('Game Component', () => {
  let mockFetchQuestions;

  beforeEach(() => {
    mockFetchQuestions = jest.fn();
    QuestionGeneration.mockImplementation(() => ({
      fetchQuestions: mockFetchQuestions,
    }));
  });

  it('should render correctly', () => {
    render(
      <Router>
        <Game />
      </Router>
    );

    expect(screen.getByText(/Welcome to the Game Page/i)).toBeInTheDocument();
  });

  it('should call fetchQuestions on mount', async () => {
    render(
      <Router>
        <Game />
      </Router>
    );

    await waitFor(() => {
      expect(mockFetchQuestions).toHaveBeenCalled();
    });
  });

  it('should update currentQuestion state when fetchQuestions is called', async () => {
    const mockSetCurrentQuestion = jest.fn();
    QuestionGeneration.mockImplementation(() => ({
      fetchQuestions: () => mockSetCurrentQuestion('Sample Question'),
    }));

    render(
      <Router>
        <Game />
      </Router>
    );

    await waitFor(() => {
      expect(mockSetCurrentQuestion).toHaveBeenCalledWith('Sample Question');
    });
  });
});