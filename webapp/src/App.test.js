import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./components/Register', () => () => <div>Register Component</div>);
jest.mock('./components/Login', () => () => <div>Login Component</div>);
jest.mock('./components/Menu', () => () => <div>Menu Component</div>);
jest.mock('./components/Game', () => () => <div>Game Component</div>);
jest.mock('./components/Stadistics', () => () => <div>Stadistics Component</div>);
jest.mock('./components/Ranking', () => () => <div>Ranking Component</div>);
jest.mock('./auth/ProtectedRoute', () => ({ element }) => element);

describe('App Routing', () => {
  it('renders Login Component for path "/"', () => {
    render(
      <MemoryRouter initialEntries={['/']} future={{ v7_relativeSplatPath: true }}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Login Component')).toBeInTheDocument();
  });

  it('renders Login Component for path "/login"', () => {
    render(
      <MemoryRouter initialEntries={['/login']} future={{ v7_relativeSplatPath: true }}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Login Component')).toBeInTheDocument();
  });

  it('renders Register Component for path "/register"', () => {
    render(
      <MemoryRouter initialEntries={['/register']} future={{ v7_relativeSplatPath: true }}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Register Component')).toBeInTheDocument();
  });

  it('renders Menu Component for path "/menu"', () => {
    render(
      <MemoryRouter initialEntries={['/menu']} future={{ v7_relativeSplatPath: true }}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Menu Component')).toBeInTheDocument();
  });

  it('renders Game Component for path "/game"', () => {
    render(
      <MemoryRouter initialEntries={['/game']} future={{ v7_relativeSplatPath: true }}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Game Component')).toBeInTheDocument();
  });

  it('renders Stadistics Component for path "/stadistics"', () => {
    render(
      <MemoryRouter initialEntries={['/stadistics']} future={{ v7_relativeSplatPath: true }}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Stadistics Component')).toBeInTheDocument();
  });

  it('renders Ranking Component for path "/ranking"', () => {
    render(
      <MemoryRouter initialEntries={['/ranking']} future={{ v7_relativeSplatPath: true }}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Ranking Component')).toBeInTheDocument();
  });
});
