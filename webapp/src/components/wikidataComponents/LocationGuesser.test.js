import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import LocationGuesser from './LocationGuesser';
import * as MappedCities from './MappedCities';
import '@testing-library/jest-dom';

// Mock del fetchRandomCity
jest.mock('./MappedCities', () => ({
    fetchRandomCity: jest.fn()
}));

// Mock básico de Leaflet
jest.mock('react-leaflet', () => {
    const React = require('react');
    return {
        MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
        TileLayer: () => <div data-testid="tile-layer" />,
        Marker: ({ position }) => <div data-testid="marker">{`Marker at ${position}`}</div>,
        Polyline: ({ positions }) => <div data-testid="polyline">{`Polyline from ${positions[0]} to ${positions[1]}`}</div>,
        useMapEvents: () => null
    };
});

describe('LocationGuesser en instancia', () => {
    const mockCity = {
        name: 'Madrid',
        lat: 40.4168,
        lng: -3.7038
    };

    beforeEach(() => {
        MappedCities.fetchRandomCity.mockResolvedValue(mockCity);
    });

    test('renders initial elements', async () => {
        await act(async () => {
            render(<LocationGuesser />);
        });

        expect(screen.getByText(/Encuentra la ciudad/)).toBeInTheDocument();
        expect(screen.getByText(/¿Dónde está Madrid\?/)).toBeInTheDocument();
        expect(screen.getByTestId('map')).toBeInTheDocument();
    });

    test('handles a guess and shows distance', async () => {
        await act(async () => {
            render(<LocationGuesser />);
        });

        const component = screen.getByTestId('map');

        // Simula un clic cerca de Barcelona
        act(() => {
            component.props.children[2].props.onGuess({ lat: 41.3874, lng: 2.1686 }); // Barcelona
        });

        // Esperar por la actualización del estado
        expect(await screen.findByText(/Fin del juego/)).toBeInTheDocument();
        expect(await screen.findByText(/¡Estás a/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Nueva partida' })).toBeInTheDocument();
    });

    test('resets game on "Nueva partida"', async () => {
        await act(async () => {
            render(<LocationGuesser />);
        });

        const component = screen.getByTestId('map');

        act(() => {
            component.props.children[2].props.onGuess({ lat: 41.3874, lng: 2.1686 }); // Guess
        });

        const button = await screen.findByRole('button', { name: 'Nueva partida' });

        await act(async () => {
            fireEvent.click(button);
        });

        expect(screen.queryByText(/Fin del juego/)).not.toBeInTheDocument();
        expect(screen.getByText(/¿Dónde está Madrid\?/)).toBeInTheDocument();
    });

    test('disables guessing after one click', async () => {
        await act(async () => {
            render(<LocationGuesser />);
        });

        const component = screen.getByTestId('map');
        const onGuess = component.props.children[2].props.onGuess;

        act(() => {
            onGuess({ lat: 41.3874, lng: 2.1686 });
        });

        // Intento de segunda adivinanza (no debería actualizar nada)
        const prevDistanceText = screen.getByText(/¡Estás a/).textContent;

        act(() => {
            onGuess({ lat: 45.0, lng: 10.0 }); // Nueva posición
        });

        expect(screen.getByText(/¡Estás a/).textContent).toBe(prevDistanceText);
    });
});
