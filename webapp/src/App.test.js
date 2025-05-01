import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import '@testing-library/jest-dom';

// --- Mocks para TODOS los componentes importados por App.js y AppContent ---
jest.mock('./components/Register', () => () => <div>Register Component</div>);
jest.mock('./components/Login', () => () => <div>Login Component</div>);
jest.mock('./components/Menu', () => () => <div>Menu Component</div>);
jest.mock('./components/Game', () => () => <div>Game Component</div>);
jest.mock('./components/TimedGame', () => () => <div>TimedGame Component</div>);
jest.mock('./components/LocationGame', () => () => <div>LocationGame Component</div>); // Mock añadido
jest.mock('./components/Stadistics', () => () => <div>Stadistics Component</div>);
jest.mock('./components/Ranking', () => () => <div>Ranking Component</div>);
jest.mock('./components/Navbar', () => ({ toggleTheme }) => <button onClick={toggleTheme}>Mock Navbar</button>); // Mock funcional si es necesario
jest.mock('./components/Profile', () => () => <div>Profile Component</div>);
jest.mock('./components/HandTracker', () => ({ enabled }) => enabled ? <div>HandTracker Enabled</div> : <div>HandTracker Disabled</div>); // Mock añadido
jest.mock('./auth/ProtectedRoute', () => ({ element }) => element); // Mock ProtectedRoute

// Mock del Context Provider y Hook
jest.mock('./components/HandNavigationContext', () => ({
  // Mockea el Provider para que simplemente renderice sus hijos
  HandNavigationProvider: ({ children }) => <>{children}</>,
  // Mockea el Hook para devolver un valor predeterminado
  useHandNavigation: () => ({
    isHandNavigationEnabled: false, // Estado predeterminado para los tests
    toggleHandNavigation: jest.fn(), // Mock de la función toggle si fuera necesaria
  }),
}));


describe('App Routing', () => {
  // Función helper para renderizar con el Router
  const renderApp = (initialRoute = '/') => {
    render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <App />
      </MemoryRouter>
    );
  };

  it('renders Login Component for path "/"', () => {
    renderApp('/');
    expect(screen.getByText('Login Component')).toBeInTheDocument();
    // También debe renderizar el Navbar mockeado
    expect(screen.getByText('Mock Navbar')).toBeInTheDocument();
    // Y el HandTracker (deshabilitado por defecto por el mock del hook)
    expect(screen.getByText('HandTracker Disabled')).toBeInTheDocument();
  });

  it('renders Login Component for path "/login"', () => {
    renderApp('/login');
    expect(screen.getByText('Login Component')).toBeInTheDocument();
  });

  it('renders Register Component for path "/register"', () => {
    renderApp('/register');
    expect(screen.getByText('Register Component')).toBeInTheDocument();
  });

  it('renders Menu Component for path "/menu"', () => {
    renderApp('/menu');
    expect(screen.getByText('Menu Component')).toBeInTheDocument();
  });

  it('renders Game Component for path "/game"', () => {
    renderApp('/game');
    expect(screen.getByText('Game Component')).toBeInTheDocument();
  });

  it('renders TimedGame Component for path "/timedGame"', () => {
    renderApp('/timedGame');
    expect(screen.getByText('TimedGame Component')).toBeInTheDocument();
  });

   it('renders LocationGame Component for path "/locationGame"', () => { // Test añadido
    renderApp('/locationGame');
    expect(screen.getByText('LocationGame Component')).toBeInTheDocument();
  });

  it('renders Stadistics Component for path "/stadistics"', () => {
    renderApp('/stadistics');
    expect(screen.getByText('Stadistics Component')).toBeInTheDocument();
  });

  it('renders Ranking Component for path "/ranking"', () => {
    renderApp('/ranking');
    expect(screen.getByText('Ranking Component')).toBeInTheDocument();
  });

  it('renders Profile Component for path "/profile"', () => {
    renderApp('/profile');
    expect(screen.getByText('Profile Component')).toBeInTheDocument();
  });

});