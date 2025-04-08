import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './Navbar';
import { BrowserRouter as Router } from 'react-router-dom';
import '@testing-library/jest-dom';

describe('Navbar Component', () => {
  const mockToggleDarkTheme = jest.fn();
  const mockToggleLightTheme = jest.fn();

  beforeEach(() => {
    mockToggleDarkTheme.mockClear();
    mockToggleLightTheme.mockClear();
  });

  test('renders Navbar with all links and buttons', () => {
    render(
      <Router>
        <Navbar toggleDarkTheme={mockToggleDarkTheme} toggleLightTheme={mockToggleLightTheme} />
      </Router>
    );

    expect(screen.getByRole('link', { name: /Menu/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Game/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Statistics/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ranking/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Profile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '☀️' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '🌙' })).toBeInTheDocument();
  });

  test('triggers light theme toggle on button click', () => {
    render(
      <Router>
        <Navbar toggleLightTheme={mockToggleLightTheme} toggleDarkTheme={mockToggleDarkTheme} />
      </Router>
    );

    fireEvent.click(screen.getByRole('button', { name: '☀️' }));
    expect(mockToggleLightTheme).toHaveBeenCalledTimes(1);
    expect(mockToggleDarkTheme).not.toHaveBeenCalled();
  });

  test('triggers dark theme toggle on button click', () => {
     render(
      <Router>
        <Navbar toggleLightTheme={mockToggleLightTheme} toggleDarkTheme={mockToggleDarkTheme} />
      </Router>
    );

    fireEvent.click(screen.getByRole('button', { name: '🌙' }));
    expect(mockToggleDarkTheme).toHaveBeenCalledTimes(1);
    expect(mockToggleLightTheme).not.toHaveBeenCalled();
  });

  test('navigates to the correct links on click', () => {
    render(
      <Router>
        <Navbar toggleDarkTheme={mockToggleDarkTheme} toggleLightTheme={mockToggleLightTheme} />
      </Router>
    );

    expect(screen.getByRole('link', { name: /Menu/i })).toHaveAttribute('href', '/menu');
    expect(screen.getByRole('link', { name: /Game/i })).toHaveAttribute('href', '/game');
    expect(screen.getByRole('link', { name: /Statistics/i })).toHaveAttribute('href', '/stadistics');
    expect(screen.getByRole('link', { name: /Ranking/i })).toHaveAttribute('href', '/ranking');
    expect(screen.getByRole('link', { name: /Profile/i })).toHaveAttribute('href', '/profile');
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
  });

  test('handles logout correctly', () => {
    // Setup localStorage with test values
    localStorage.setItem('username', 'testuser');
    localStorage.setItem('authToken', 'testtoken');

    render(
      <Router>
        <Navbar toggleDarkTheme={mockToggleDarkTheme} toggleLightTheme={mockToggleLightTheme} />
      </Router>
    );

    // Click logout button
    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));

    // Verify localStorage items are removed
    expect(localStorage.getItem('username')).toBeNull();
    expect(localStorage.getItem('authToken')).toBeNull();
  });
});