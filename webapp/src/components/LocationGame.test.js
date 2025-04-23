import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LocationGame from './LocationGame';
import { BrowserRouter } from 'react-router-dom';
jest.mock('./wikidataComponents/MappedCities');
jest.mock('./wikidataComponents/LocationGuesser', () => () => <div>LocationGame</div>);
jest.mock('./ChatLLM', () => () => <div>ChatLLM</div>);


describe('Location Component', () => {
  it('renders TimedQuestionPresentation and ChatLLM components', async () => {
    render(
      <BrowserRouter>
        <LocationGame />
      </BrowserRouter>
    );
    expect(screen.getByText('LocationGuesser')).toBeInTheDocument();
    expect(screen.getByText('ChatLLM')).toBeInTheDocument();
  });

  it('calls fetchQuestions on mount', async () => {
    const mockFetchCity = jest.fn();
    require('./wikidataComponents/MappedCities.js').default.mockImplementation(() => {
      return { fetchRandomCity: mockFetchCity };
    });

    render(
      <BrowserRouter>
        <LocationGame />
      </BrowserRouter>
    );
    await waitFor(() => expect(mockFetchCity).toHaveBeenCalled());
  });
});