import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { fetchRandomCity } from './MappedCities';

const mock = new MockAdapter(axios);

describe('fetchRandomCity', () => {
    beforeEach(() => {
        // Limpia caché entre tests
        jest.resetModules();
    });

    test('returns a cached city if cache is filled', async () => {
        const { fetchRandomCity: cachedFetch } = require('./MappedCities');

        // Simular una ciudad cacheada
        const mockCity = { name: 'Madrid', lat: 40.4, lng: -3.7 };
        const cacheRef = require('./MappedCities');
        cacheRef.__setCityCache = [mockCity];

        // Sobrescribe manualmente cityCache para este test
        cacheRef.cityCache = [mockCity];

        const result = await cachedFetch();
        expect(result).toEqual(mockCity);
    });

    test('fetches from Wikidata and returns a random city', async () => {
        const mockResponse = {
            results: {
                bindings: [
                    {
                        cityLabel: { value: 'Barcelona' },
                        lat: { value: '41.3874' },
                        lon: { value: '2.1686' }
                    },
                    {
                        cityLabel: { value: 'Q12345' }, // Debe ser ignorado
                        lat: { value: '0' },
                        lon: { value: '0' }
                    }
                ]
            }
        };

        mock.onGet(/query=/).reply(200, mockResponse);

        const result = await fetchRandomCity();
        expect(result).toHaveProperty('name', 'Barcelona');
        expect(typeof result.lat).toBe('number');
        expect(typeof result.lng).toBe('number');
    });

    test('throws error if no valid city names', async () => {
        const mockResponse = {
            results: {
                bindings: [
                    {
                        cityLabel: { value: 'Q12345' },
                        lat: { value: '0' },
                        lon: { value: '0' }
                    }
                ]
            }
        };

        mock.onGet(/query=/).reply(200, mockResponse);

        await expect(fetchRandomCity()).rejects.toThrow('No se encontraron nombres válidos');
    });

    test('throws error on HTTP failure', async () => {
        mock.onGet(/query=/).networkError();

        await expect(fetchRandomCity()).rejects.toThrow('Network Error');
    });
});
