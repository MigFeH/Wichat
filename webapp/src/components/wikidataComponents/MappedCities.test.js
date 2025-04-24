import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {__setCityCacheForTest, fetchRandomCity} from './MappedCities';

const mock = new MockAdapter(axios);

describe('fetchRandomCity', () => {
    beforeEach(() => {
        // Limpia caché entre tests
        jest.resetModules();
    });

    test('returns a cached city if cache is filled', async () => {
        const mockCity = { name: 'Barcelona', lat: 41.3874, lng: 2.1686 };
        __setCityCacheForTest([mockCity]);

        const result = await fetchRandomCity();
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

    test('throws error on HTTP failure', async () => {
        __setCityCacheForTest([]); // Asegura que se haga el fetch real

        mock.onGet(/query=/).networkError();

        await expect(fetchRandomCity()).rejects.toThrow('Network Error');
    });
});
