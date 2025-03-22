import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Menu from './Menu';
import { BrowserRouter } from 'react-router-dom';

// Creamos un mock para la función useNavigate
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}));

describe('Componente Menu', () => {
  beforeEach(() => {
    // Reiniciamos el mock antes de cada test para evitar llamadas acumuladas !!!
    mockedUsedNavigate.mockReset();
  });

  it('se renderiza correctamente', () => {
    render(
      <BrowserRouter>
        <Menu />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /hey!! are you ready\?/i })).toBeInTheDocument();
    expect(screen.getByText(/press start to play/i)).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /start!/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stadistics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ranking/i })).toBeInTheDocument();
  });

  it('navega a la página de juego al hacer clic en "Start!"', () => {
    render(
      <BrowserRouter>
        <Menu />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /start!/i }));
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/game');
  });

  it('navega a la página de stadistics al hacer clic en "Stadistics"', () => {
    render(
      <BrowserRouter>
        <Menu />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /stadistics/i }));
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/stadistics');
  });

  it('navega a la página de ranking al hacer clic en "Ranking"', () => {
    render(
      <BrowserRouter>
        <Menu />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /ranking/i }));
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/ranking');
  });
});
