import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Menu from './Menu';

// filepath: c:\Local\ASW\wichat_es2b\wichat_es2b\webapp\src\components\Menu.test.js

describe('Menu component', () => {
    it('should render correctly', () => {
        render(
            <MemoryRouter>
                <Menu />
            </MemoryRouter>
        );

        expect(screen.getByText(/Hey!! Are you ready\? 🌊/i)).toBeInTheDocument();
        expect(screen.getByText(/Press start to play./i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Start!/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Stadistics/i })).toBeInTheDocument();
    });

    it('should navigate to game page on Start button click', () => {
        const { container } = render(
            <MemoryRouter>
                <Menu />
            </MemoryRouter>
        );

        const startButton = screen.getByRole('button', { name: /Start!/i });
        fireEvent.click(startButton);

        expect(container.innerHTML).toMatch(/\/game/);
    });

    it('should navigate to stadistics page on Stadistics button click', () => {
        const { container } = render(
            <MemoryRouter>
                <Menu />
            </MemoryRouter>
        );

        const stadisticsButton = screen.getByRole('button', { name: /Stadistics/i });
        fireEvent.click(stadisticsButton);

        expect(container.innerHTML).toMatch(/\/stadistics/);
    });
});