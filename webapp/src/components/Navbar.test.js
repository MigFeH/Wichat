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

  test('renders Navbar with all top-level links and switch in desktop view', () => {
    useMediaQuery.mockReturnValue(false); // Desktop view
    renderNavbar();

    expect(screen.getByRole('link', { name: /Menu/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Statistics/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ranking/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Profile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Games/i })).toBeInTheDocument(); // Dropdown
    expect(screen.getByRole('checkbox')).toBeInTheDocument(); // Theme switch
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
  });

  test('opens Games menu and navigates to sub-items in desktop view', () => {
    useMediaQuery.mockReturnValue(false); // Desktop view
    renderNavbar();

    const gamesButton = screen.getByRole('button', { name: /Games/i });
    fireEvent.click(gamesButton);

    const timedGame = screen.getByText('Timed Game');
    const nonTimedGame = screen.getByText('Non Timed Game');
    expect(timedGame).toBeInTheDocument();
    expect(nonTimedGame).toBeInTheDocument();

    fireEvent.click(timedGame);
    expect(mockNavigate).toHaveBeenCalledWith('/timedGame');
  });

  test('theme toggle switch triggers callback', () => {
    useMediaQuery.mockReturnValue(false);
    renderNavbar();

    const switchBtn = screen.getByRole('checkbox');
    fireEvent.click(switchBtn);
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });

  test('opens drawer in mobile view and shows all items', () => {
    useMediaQuery.mockReturnValue(true); // Mobile view
    renderNavbar();

    fireEvent.click(screen.getByLabelText('hamburger-menu'));

    expect(screen.getByText(/Menu/i)).toBeInTheDocument();
    expect(screen.getByText(/Games/i)).toBeInTheDocument();
    expect(screen.getByText(/Statistics/i)).toBeInTheDocument();
    expect(screen.getByText(/Ranking/i)).toBeInTheDocument();
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  test('expands Games drawer subitems and navigates on click', () => {
    useMediaQuery.mockReturnValue(true);
    renderNavbar();
  
    fireEvent.click(screen.getByLabelText('hamburger-menu'));
  
    const gamesDrawerItem = screen.getByText(/Games/i);
    fireEvent.click(gamesDrawerItem);
  
    const nonTimed = screen.getByRole('link', { name: /Non Timed Game/i });
  
    expect(nonTimed).toHaveAttribute('href', '/game');
  });  

  test('logout button clears localStorage and navigates to login', () => {
    useMediaQuery.mockReturnValue(false); // Desktop
    renderNavbar();

    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('username')).toBeNull();
  });
});
