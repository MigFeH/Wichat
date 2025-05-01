import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import Ranking from './Ranking';
import { BrowserRouter as Router } from 'react-router-dom';
import axios from 'axios';
import '@testing-library/jest-dom';

const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}));

jest.mock('axios');

describe('Ranking Component', () => {
  beforeEach(() => {
    axios.get.mockClear();
    mockedUsedNavigate.mockClear();
    jest.restoreAllMocks();
  });

  test('renders loading state initially', () => {
    axios.get.mockImplementation(() => new Promise(() => {}));
    render(
      <Router>
        <Ranking />
      </Router>
    );
    expect(screen.getByText(/Loading ranking.../i)).toBeInTheDocument();
  });

  test('renders error message on fetch failure', async () => {
    const errorMessage = 'Network Error';
    axios.get.mockRejectedValueOnce({ message: errorMessage });
    render(
      <Router>
        <Ranking />
      </Router>
    );
    await waitFor(() =>
       expect(screen.getByText(new RegExp(`Failed to fetch ranking data. ${errorMessage}`, 'i'))).toBeInTheDocument()
    );
    expect(screen.queryByText(/Loading ranking.../i)).not.toBeInTheDocument();
  });

  test('renders ranking data correctly after fetch', async () => {
    const rankingData = [
      { username: 'user1', score: 10, profileImage: 'profile_5.gif' },
      { username: 'user2', score: 8, profileImage: 'profile_default.png' },
      { username: 'user3', score: 5 },
    ];
    axios.get.mockResolvedValueOnce({ data: rankingData });

    render(
      <Router>
        <Ranking />
      </Router>
    );

    await waitFor(() => expect(screen.queryByText(/Loading ranking.../i)).not.toBeInTheDocument());

    expect(screen.getByRole('heading', { name: /ranking/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /position/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /avatar/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /username/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /score/i })).toBeInTheDocument();

    const row1 = screen.getByRole('row', { name: /1 user1 10/i });
    expect(row1).toBeInTheDocument();
    expect(within(row1).getByText('1')).toBeInTheDocument();
    expect(within(row1).getByText('user1')).toBeInTheDocument();
    expect(within(row1).getByText('10')).toBeInTheDocument();
    expect(within(row1).getByAltText('user1')).toHaveAttribute('src', '/profile/profile_5.gif');

    const row2 = screen.getByRole('row', { name: /2 user2 8/i });
    expect(row2).toBeInTheDocument();
    expect(within(row2).getByText('2')).toBeInTheDocument();
    expect(within(row2).getByText('user2')).toBeInTheDocument();
    expect(within(row2).getByText('8')).toBeInTheDocument();
    expect(within(row2).getByAltText('user2')).toHaveAttribute('src', '/profile/profile_default.png');

    const row3 = screen.getByRole('row', { name: /3 user3 5/i });
    expect(row3).toBeInTheDocument();
    expect(within(row3).getByText('3')).toBeInTheDocument();
    expect(within(row3).getByText('user3')).toBeInTheDocument();
    expect(within(row3).getByText('5')).toBeInTheDocument();
    expect(within(row3).getByAltText('user3')).toHaveAttribute('src', '/profile/profile_1.gif');
  });

  test('renders error message on invalid data format from server', async () => {
     const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    axios.get.mockResolvedValueOnce({ data: { error: 'invalid format' } });
    render(
      <Router>
        <Ranking />
      </Router>
    );
    await waitFor(() => expect(screen.getByText(/Invalid data format received from server./i)).toBeInTheDocument());
    expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid data format received:', { error: 'invalid format' });
    expect(screen.queryByText(/Loading ranking.../i)).not.toBeInTheDocument();
    consoleErrorSpy.mockRestore();
  });

  test('calls navigate on Back to Menu click', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    render(
      <Router>
        <Ranking />
      </Router>
    );
    await waitFor(() => expect(screen.queryByText(/Loading ranking.../i)).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /back to menu/i }));
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/menu');
    expect(mockedUsedNavigate).toHaveBeenCalledTimes(1);
  });

  test('handles image loading error by setting fallback source', async () => {
    const rankingData = [ { username: 'userError', score: 1, profileImage: 'invalid-image.gif' } ];
    axios.get.mockResolvedValueOnce({ data: rankingData });

    render(
        <Router>
            <Ranking />
        </Router>
    );

    await waitFor(() => expect(screen.queryByText(/Loading ranking.../i)).not.toBeInTheDocument());

    const avatarImg = screen.getByAltText('userError');
    expect(avatarImg).toHaveAttribute('src', '/profile/invalid-image.gif');

    fireEvent.error(avatarImg);

    expect(avatarImg).toHaveAttribute('src', '/profile/profile_1.gif');
  });
});