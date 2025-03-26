import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Ranking from './Ranking';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}));
jest.mock('axios');

describe('Ranking Component', () => {
  beforeEach(() => {
    mockedUsedNavigate.mockReset();
  });

  it('renders error message on fetch failure', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));
    render(
      <BrowserRouter>
        <Ranking />
      </BrowserRouter>
    );
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(screen.getByText('Failed to fetch ranking data')).toBeInTheDocument();
  });

  it('renders ranking data', async () => {
    const rankingData = [
      { index: 1, _id: 'user1', score: 10 },
      { index: 2, _id: 'user2', score: 8 }
    ];
    axios.get.mockResolvedValueOnce({ data: rankingData });
    render(
      <BrowserRouter>
        <Ranking />
      </BrowserRouter>
    );
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(screen.getByText('Ranking')).toBeInTheDocument();

    expect(screen.getByText('Position')).toBeInTheDocument();
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders error message on invalid data format', async () => {
    axios.get.mockResolvedValueOnce({ data: "" });
    render(
      <BrowserRouter>
        <Ranking />
      </BrowserRouter>
    );
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(screen.getByText('Invalid data format')).toBeInTheDocument();
  });

  it('calls navigate on Back to Menu click', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    render(
      <BrowserRouter>
        <Ranking />
      </BrowserRouter>
    );
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: /back to menu/i }));
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/menu');
  });
});
