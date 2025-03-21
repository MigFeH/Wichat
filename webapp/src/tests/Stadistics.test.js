import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Stadistics from './Stadistics';

// filepath: c:\Local\ASW\wichat_es2b\wichat_es2b\webapp\src\components\Stadistics.test.js

describe('Stadistics component', () => {
  it('should render correctly', () => {
    render(
      <MemoryRouter>
        <Stadistics />
      </MemoryRouter>
    );

    expect(screen.getByText(/Estadísticas/i)).toBeInTheDocument();
    expect(screen.getByText(/Partidas jugadas: 10/i)).toBeInTheDocument();
    expect(screen.getByText(/Preguntas acertadas: 50/i)).toBeInTheDocument();
    expect(screen.getByText(/Preguntas falladas: 20/i)).toBeInTheDocument();
    expect(screen.getByText(/Tiempos por partida:/i)).toBeInTheDocument();
    expect(screen.getByText(/Partida 1: 120 segundos/i)).toBeInTheDocument();
    expect(screen.getByText(/Partida 10: 320 segundos/i)).toBeInTheDocument();
  });

  it('should navigate to menu page on Volver button click', () => {
    const { container } = render(
      <MemoryRouter>
        <Stadistics />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /Volver/i });
    fireEvent.click(backButton);

    expect(container.innerHTML).toMatch(/\/menu/);
  });
});