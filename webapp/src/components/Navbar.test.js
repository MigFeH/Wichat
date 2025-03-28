import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './Navbar';
import { BrowserRouter as Router } from 'react-router-dom';

describe('Navbar Component', () => {
  test('renders Navbar with links and buttons', () => {
    render(
      <Router>
        <Navbar />
      </Router>
    );

    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Game')).toBeInTheDocument();
    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText('Ranking')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('triggers light theme toggle on button click', () => {
    const toggleLightTheme = jest.fn();

    render(
      <Router>
        <Navbar toggleLightTheme={toggleLightTheme} />
      </Router>
    );

    fireEvent.click(screen.getByText('☀️'));
    expect(toggleLightTheme).toHaveBeenCalledTimes(1);
  });

  test('triggers dark theme toggle on button click', () => {
    const toggleDarkTheme = jest.fn();

    render(
      <Router>
        <Navbar toggleDarkTheme={toggleDarkTheme} />
      </Router>
    );

    fireEvent.click(screen.getByText('🌙'));
    expect(toggleDarkTheme).toHaveBeenCalledTimes(1);
  });

  test('navigates to the correct link', () => {
    render(
      <Router>
        <Navbar />
      </Router>
    );

    fireEvent.click(screen.getByText('Menu'));
    expect(window.location.pathname).toBe('/menu');

    fireEvent.click(screen.getByText('Game'));
    expect(window.location.pathname).toBe('/game');

    fireEvent.click(screen.getByText('Statistics'));
    expect(window.location.pathname).toBe('/stadistics');

    fireEvent.click(screen.getByText('Ranking'));
    expect(window.location.pathname).toBe('/ranking');
  });
});
