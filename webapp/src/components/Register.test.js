import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Register from './Register';

// Mock axios
jest.mock('axios');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

// Test constants
const TEST_CREDENTIALS = {
    validUsername: 'testuser123',
    validPassword: process.env.TEST_PASSWORD || 'test_password_123',
    shortUsername: 'ab',
    shortPassword: 'ab'
};

describe('Register Component', () => {
    beforeEach(() => {
        render(
            <BrowserRouter>
                <Register />
            </BrowserRouter>
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders register form', () => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /add user/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /add user/i })).toBeInTheDocument();
        expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    });

    test('validates username length', async () => {
        const addButton = screen.getByRole('button', { name: /add user/i });
        const usernameInput = screen.getByLabelText(/username/i);

        fireEvent.change(usernameInput, { target: { value: TEST_CREDENTIALS.shortUsername } });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByText(/Username must have at least 3 characters/i)).toBeInTheDocument();
        });
    });

    test('validates password length', async () => {
        const addButton = screen.getByRole('button', { name: /add user/i });
        const usernameInput = screen.getByLabelText(/username/i);
        const passwordInput = screen.getByLabelText(/password/i);

        fireEvent.change(usernameInput, { target: { value: TEST_CREDENTIALS.validUsername } });
        fireEvent.change(passwordInput, { target: { value: TEST_CREDENTIALS.shortPassword } });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByText(/Password must have at least 3 characters/i)).toBeInTheDocument();
        });
    });

    test('handles successful registration', async () => {
        axios.post.mockResolvedValueOnce({ data: {} });

        const addButton = screen.getByRole('button', { name: /add user/i });
        const usernameInput = screen.getByLabelText(/username/i);
        const passwordInput = screen.getByLabelText(/password/i);

        fireEvent.change(usernameInput, { target: { value: TEST_CREDENTIALS.validUsername } });
        fireEvent.change(passwordInput, { target: { value: TEST_CREDENTIALS.validPassword } });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/adduser'),
                { 
                    username: TEST_CREDENTIALS.validUsername, 
                    password: TEST_CREDENTIALS.validPassword 
                }
            );
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    test('handles registration error', async () => {
        const errorMessage = 'Username already exists';
        axios.post.mockRejectedValueOnce({ 
            response: { data: { error: errorMessage } }
        });

        const addButton = screen.getByRole('button', { name: /add user/i });
        const usernameInput = screen.getByLabelText(/username/i);
        const passwordInput = screen.getByLabelText(/password/i);

        fireEvent.change(usernameInput, { target: { value: TEST_CREDENTIALS.validUsername } });
        fireEvent.change(passwordInput, { target: { value: TEST_CREDENTIALS.validPassword } });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
        });
    });

    test('navigates to login page when link is clicked', () => {
        const loginLink = screen.getByText(/already have an account/i);
        fireEvent.click(loginLink);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('handles snackbar close', async () => {
        axios.post.mockResolvedValueOnce({ data: {} });

        const addButton = screen.getByRole('button', { name: /add user/i });
        const usernameInput = screen.getByLabelText(/username/i);
        const passwordInput = screen.getByLabelText(/password/i);

        fireEvent.change(usernameInput, { target: { value: TEST_CREDENTIALS.validUsername } });
        fireEvent.change(passwordInput, { target: { value: TEST_CREDENTIALS.validPassword } });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByText(/User added successfully/i)).toBeInTheDocument();
        });
    });
});