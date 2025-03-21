import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Register from '../components/Register';

const mockAxios = new MockAdapter(axios);

describe('AddUser component', () => {
  beforeEach(() => {
    mockAxios.reset();
  });

  it('should add user successfully', async () => {
    render(<Register />);

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const addUserButton = screen.getByRole('button', { name: /Add User/i });

    // Mock the axios.post request to simulate a successful response
    mockAxios.onPost('http://localhost:8000/adduser').reply(200);

    // Simulate user input
    fireEvent.change(usernameInput, { target: { value: 'testUser' } });
    fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

    // Trigger the add user button click
    fireEvent.click(addUserButton);

    // Wait for the Snackbar to be open
    await waitFor(() => {
      expect(screen.getByText(/User added successfully/i)).toBeInTheDocument();
    });
  });

  it('should handle error when adding user', async () => {
    render(<Register />);

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const addUserButton = screen.getByRole('button', { name: /Add User/i });

    // Mock the axios.post request to simulate an error response
    mockAxios.onPost('http://localhost:8000/adduser').reply(500, { error: 'Internal Server Error' });

    // Simulate user input
    fireEvent.change(usernameInput, { target: { value: 'testUser' } });
    fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

    // Trigger the add user button click
    fireEvent.click(addUserButton);

    // Wait for the error Snackbar to be open
    await waitFor(() => {
      expect(screen.getByText(/Error: Internal Server Error/i)).toBeInTheDocument();
    });
  });
});
it('should close success Snackbar when handleCloseSnackbar is called', async () => {
  render(<Register />);

  const usernameInput = screen.getByLabelText(/Username/i);
  const passwordInput = screen.getByLabelText(/Password/i);
  const addUserButton = screen.getByRole('button', { name: /Add User/i });

  // Mock the axios.post request to simulate a successful response
  mockAxios.onPost('http://localhost:8000/adduser').reply(200);

  // Simulate user input
  fireEvent.change(usernameInput, { target: { value: 'testUser' } });
  fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

  // Trigger the add user button click
  fireEvent.click(addUserButton);

  // Wait for the Snackbar to be open
  await waitFor(() => {
    expect(screen.getByText(/User added successfully/i)).toBeInTheDocument();
  });

  // Close the Snackbar
  const snackbar = screen.getByText(/User added successfully/i).closest('div');
  fireEvent.click(snackbar.querySelector('button'));

  // Wait for the Snackbar to be closed
  await waitFor(() => {
    expect(screen.queryByText(/User added successfully/i)).not.toBeInTheDocument();
  });
});

it('should close error Snackbar when handleCloseSnackbar is called', async () => {
  render(<Register />);

  const usernameInput = screen.getByLabelText(/Username/i);
  const passwordInput = screen.getByLabelText(/Password/i);
  const addUserButton = screen.getByRole('button', { name: /Add User/i });

  // Mock the axios.post request to simulate an error response
  mockAxios.onPost('http://localhost:8000/adduser').reply(500, { error: 'Internal Server Error' });

  // Simulate user input
  fireEvent.change(usernameInput, { target: { value: 'testUser' } });
  fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

  // Trigger the add user button click
  fireEvent.click(addUserButton);

  // Wait for the error Snackbar to be open
  await waitFor(() => {
    expect(screen.getByText(/Error: Internal Server Error/i)).toBeInTheDocument();
  });

  // Close the Snackbar
  const snackbar = screen.getByText(/Error: Internal Server Error/i).closest('div');
  fireEvent.click(snackbar.querySelector('button'));

  // Wait for the Snackbar to be closed
  await waitFor(() => {
    expect(screen.queryByText(/Error: Internal Server Error/i)).not.toBeInTheDocument();
  });
});
