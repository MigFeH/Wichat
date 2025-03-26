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
    expect(screen.getByText(/Select a game to play!/i)).toBeInTheDocument();
    
    expect(screen.getByRole('button', { name: /^Non Timed game!$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Timed game!$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Stadistics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ranking/i })).toBeInTheDocument();
  });

  it('navega a la página de juego sin tiempo al hacer clic en "Non Timed game!"', () => {
    render(
      <BrowserRouter>
        <Menu />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /^Non Timed game!$/i }));
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/game');
  });

  it('navega a la página de juego con tiempo al hacer clic en "Timed game!"', () => {
    render(
      <BrowserRouter>
        <Menu />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /^Timed game!$/i }));
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/timedGame');
  });

  it('navega a la página de stadistics al hacer clic en "Stadistics"', () => {
    render(
      <BrowserRouter>
        <Menu />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Stadistics/i }));
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/stadistics');
  });

  it('navega a la página de ranking al hacer clic en "Ranking"', () => {
    render(
      <BrowserRouter>
        <Menu />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /Ranking/i }));
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/ranking');
  });
});
