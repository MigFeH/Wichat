import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Game from '../components/Game';
import QuestionGeneration from '../components/wikidataComponents/QuestionGeneration';

jest.mock('../components/wikidataComponents/QuestionGeneration');

describe('Game Component', () => {
  let mockSetQuestion;
  let questionGenerator;

  beforeEach(() => {
    mockSetQuestion = jest.fn();
    questionGenerator = new QuestionGeneration(mockSetQuestion);
    questionGenerator.fetchQuestions = jest.fn().mockResolvedValue(); // Mock de la función fetchQuestions
  });

  it('calls fetchQuestions on mount and renders QuestionPresentation', async () => {
    render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(questionGenerator.fetchQuestions).toHaveBeenCalled();
    });

    expect(screen.getByText('QuestionPresentation Component')).toBeInTheDocument();
  });
});
