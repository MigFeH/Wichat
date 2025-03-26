import React from 'react';
import { render, screen } from '@testing-library/react';
import Game from './Game';
import { BrowserRouter } from 'react-router-dom';
import QuestionGeneration from './wikidataComponents/QuestionGeneration.js';

jest.mock('./wikidataComponents/QuestionGeneration.js', () => {
  return jest.fn().mockImplementation(() => ({
    fetchQuestions: jest.fn(),
  }));
});

jest.mock('./wikidataComponents/QuestionPresentation.jsx', () => (props) => (
  <div data-testid="question-presentation">QuestionPresentation</div>
));

describe('Game Component', () => {
  it('calls fetchQuestions on mount and renders QuestionPresentation', () => {
    render(
      <BrowserRouter>
        <Game />
      </BrowserRouter>
    );
    
    expect(QuestionGeneration).toHaveBeenCalledTimes(1);
    const instance = QuestionGeneration.mock.results[0].value;
    expect(instance.fetchQuestions).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('question-presentation')).toBeInTheDocument();
  });
});
