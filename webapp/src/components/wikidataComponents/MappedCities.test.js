import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
    __setCityCacheForTest,
    fetchRandomCity
} from './MappedCities';

const mock = new MockAdapter(axios);

describe('fetchRandomCity', () => {
    beforeEach(() => {
        __setCityCacheForTest([]);
        mock.reset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('returns a cached city if cache is filled', async () => {
        const mockCity = { name: 'Barcelona', lat: 41.3874, lng: 2.1686 };
        __setCityCacheForTest([mockCity]);

        const result = await fetchRandomCity();
        expect(result).toEqual(mockCity);
        expect(mock.history.get.length).toBe(0);
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
                        cityLabel: { value: 'Q12345' },
                        lat: { value: '0' },
                        lon: { value: '0' }
                    },
                     {
                        lat: { value: '1' },
                        lon: { value: '1' }
                    }
                ]
            }
        };

        mock.onGet(/query=/).reply(200, mockResponse);

        const result = await fetchRandomCity();
        expect(result).toHaveProperty('name', 'Barcelona');
        expect(result).toHaveProperty('lat', 41.3874);
        expect(result).toHaveProperty('lng', 2.1686);
        expect(typeof result.lat).toBe('number');
        expect(typeof result.lng).toBe('number');
        expect(mock.history.get.length).toBe(1);
    });

    test('throws error on HTTP failure', async () => {
        mock.onGet(/query=/).networkError();
        await expect(fetchRandomCity()).rejects.toThrow('Network Error');
        expect(mock.history.get.length).toBe(1);
    });

    test('throws error when Wikidata returns no valid cities', async () => {
        const invalidResponse = {
            results: {
                bindings: [
                    { cityLabel: { value: 'Q99999' }, lat: { value: '0' }, lon: { value: '0' } },
                    { lat: { value: '1' }, lon: { value: '1' } }
                ]
            }
        };

        mock.onGet(/query=/).reply(200, invalidResponse);

        await expect(fetchRandomCity()).rejects.toThrow("No se encontraron nombres válidos en la primera carga.");
        expect(mock.history.get.length).toBe(1);
    });

    test('does not call HTTP when cache has cities', async () => {
        const mockCity = { name: 'Sevilla', lat: 37.3, lng: -5.9 };
        __setCityCacheForTest([mockCity]);

        const city = await fetchRandomCity();
        expect(city).toEqual(mockCity);
        expect(mock.history.get.length).toBe(0);
    });

    test('returns different cities randomly from cache', async () => {
        const cities = [
            { name: 'Madrid', lat: 40.4, lng: -3.7 },
            { name: 'Valencia', lat: 39.47, lng: -0.38 }
        ];
        __setCityCacheForTest(cities);

        const mathRandomSpy = jest.spyOn(global.Math, 'random')
            .mockReturnValueOnce(0.1)
            .mockReturnValueOnce(0.9);

        const city1 = await fetchRandomCity();
        const city2 = await fetchRandomCity();

        expect(city1.name).toBe('Madrid');
        expect(city2.name).toBe('Valencia');
        expect(mathRandomSpy).toHaveBeenCalledTimes(2);
        expect(mock.history.get.length).toBe(0);

    });
});