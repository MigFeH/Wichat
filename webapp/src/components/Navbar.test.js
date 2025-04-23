import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './Navbar';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

// Mock Material-UI hooks
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Navbar Component', () => {
  const mockToggleTheme = jest.fn();

  const renderNavbar = () => {
    return render(
      <ThemeProvider theme={createTheme()}>
        <Router>
          <Navbar toggleTheme={mockToggleTheme} />
        </Router>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    mockToggleTheme.mockClear();
    mockNavigate.mockClear();
    useMediaQuery.mockClear();
    localStorage.clear();
  });

  test('renders Navbar with all links and buttons', () => {
    renderNavbar();

    expect(screen.getByRole('link', { name: /Menu/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Game/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Statistics/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ranking/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Profile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument(); // El switch
  });

  test('triggers UI theme switch', () => {
    renderNavbar();

    const switchButton = screen.getByRole('checkbox');

    fireEvent.click(switchButton);
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);

    fireEvent.click(switchButton);
    expect(mockToggleTheme).toHaveBeenCalledTimes(2);
  });

  test('navigates to the correct links on click', () => {
    renderNavbar();

    expect(screen.getByRole('link', { name: /Menu/i })).toHaveAttribute('href', '/menu');
    expect(screen.getByRole('link', { name: /Game/i })).toHaveAttribute('href', '/game');
    expect(screen.getByRole('link', { name: /Statistics/i })).toHaveAttribute('href', '/stadistics');
    expect(screen.getByRole('link', { name: /Ranking/i })).toHaveAttribute('href', '/ranking');
    expect(screen.getByRole('link', { name: /Profile/i })).toHaveAttribute('href', '/profile');
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument(); // El switch
  });

  test('renders drawer content correctly in mobile view', () => {
    useMediaQuery.mockReturnValue(true); // Simulate mobile view

    renderNavbar();

    // Buscar el botón del menú hamburguesa
    const menuButton = screen.getByLabelText('hamburger-menu');
    fireEvent.click(menuButton);

    // Verificar el contenido del drawer
    expect(screen.getByText(/Menu/i)).toBeInTheDocument();
    expect(screen.getByText(/Game/i)).toBeInTheDocument();
    expect(screen.getByText(/Statistics/i)).toBeInTheDocument();
    expect(screen.getByText(/Ranking/i)).toBeInTheDocument();
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument(); // El switch
  });

  test('handles logout button click in desktop view', () => {
    useMediaQuery.mockReturnValue(false); // Simulate desktop view

    renderNavbar();

    // Verificar que el botón de logout está presente
    const logoutButton = screen.getByRole('button', { name: /Logout/i });
    expect(logoutButton).toBeInTheDocument();

    // Simular clic en el botón de logout
    fireEvent.click(logoutButton);

    // Verificar que se navega a la página de login
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});