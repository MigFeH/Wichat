import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Stadistics from './Stadistics';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}));
jest.mock('axios');

describe('Stadistics Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsedNavigate.mockReset();
    localStorage.setItem('username', 'testUser');
  });

  it('renders error message on fetch failure', async () => {
    axios.get.mockRejectedValueOnce({
      response: {
        status: 500,
        data: 'Internal Server Error'
      }
    });
    render(
      <BrowserRouter>
        <Stadistics />
      </BrowserRouter>
    );
    await waitFor(() => expect(screen.getByText('Failed to fetch statistics')).toBeInTheDocument());
  });

  it('renders error message on invalid data format', async () => {
    axios.get.mockResolvedValueOnce({ data: 42 });
    render(
      <BrowserRouter>
        <Stadistics />
      </BrowserRouter>
    );
    await waitFor(() => expect(screen.getByText('Invalid data format')).toBeInTheDocument());
  });
});