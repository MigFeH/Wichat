import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import TimedGame from './TimedGame';
import { BrowserRouter } from 'react-router-dom';
jest.mock('./wikidataComponents/QuestionGeneration.js');
jest.mock('./wikidataComponents/TimedQuestionPresentation.jsx', () => () => <div>TimedQuestionPresentation</div>);
jest.mock('./ChatLLM', () => () => <div>ChatLLM</div>);


describe('TimedGame Component', () => {
  it('renders TimedQuestionPresentation and ChatLLM components', async () => {
    render(
      <BrowserRouter>
        <TimedGame />
      </BrowserRouter>
    );

    expect(screen.getByText('TimedQuestionPresentation')).toBeInTheDocument();
    expect(screen.getByText('ChatLLM')).toBeInTheDocument();
  });
});
