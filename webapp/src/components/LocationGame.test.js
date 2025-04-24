import React from 'react';
import { render, screen } from '@testing-library/react';
import LocationGame from './LocationGame';
import { BrowserRouter } from 'react-router-dom';

// Mock del componente LocationGuesser
jest.mock('./wikidataComponents/LocationGuesser', () => () => <div>LocationGame</div>);

// Mock del módulo MappedCities
import * as MappedCities from './wikidataComponents/MappedCities';

describe('Location Component', () => {
  it('renders LocationGuesser component', () => {
    render(
        <BrowserRouter>
          <LocationGame />
        </BrowserRouter>
    );
    expect(screen.getByText('LocationGame')).toBeInTheDocument();
  });

  it('calls fetchRandomCity on mount', async () => {
    const mockCity = { name: 'TestCity', lat: 10, lng: 10 };
    const mockFetch = jest.fn().mockResolvedValue(mockCity);
    MappedCities.fetchRandomCity = mockFetch;

    render(
        <BrowserRouter>
          <LocationGame />
        </BrowserRouter>
    );

    // Esperamos que fetchRandomCity haya sido llamado al menos una vez
    expect(mockFetch).toHaveBeenCalled();
  });
});
