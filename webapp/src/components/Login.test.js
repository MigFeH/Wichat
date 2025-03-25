import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}));
jest.mock('axios');

describe('Login Component', () => {
  beforeEach(() => {
    mockedUsedNavigate.mockReset();
    localStorage.clear();
  });

  it('shows error when username is too short', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'ab' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'validPass' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(screen.getByText(/username must have at least 3 characters/i)).toBeInTheDocument());
  });

  it('shows error when password is too short', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'validUser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'ab' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(screen.getByText(/password must have at least 3 characters/i)).toBeInTheDocument());
  });

  it('logs in successfully and navigates to menu', async () => {
    const responseData = { createdAt: '2025-03-22T12:00:00Z', token: 'valid-token' };
    axios.post.mockResolvedValueOnce({ data: responseData });
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'validUser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'validPass' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(localStorage.getItem('authToken')).toBe('valid-token');
    expect(localStorage.getItem('username')).toBe('validUser');
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/menu');
    await waitFor(() => expect(screen.getByText(/login successful/i)).toBeInTheDocument());
  });

  it('navigates to register page on link click', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /don't have an account\? register here\./i }));
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/register');
  });
});
