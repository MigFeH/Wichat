import QuestionGeneration from './QuestionGeneration';

global.fetch = jest.fn();

let cryptoSpy;

describe('QuestionGeneration', () => {
    let questionGen;
    let setQuestion;

    beforeEach(() => {
        jest.clearAllMocks();
        setQuestion = jest.fn();
        questionGen = new QuestionGeneration(setQuestion);
        global.fetch = jest.fn();

        // --- INICIO DE LA CORRECCIÓN ---
        // Asegurar que global.crypto y getRandomValues existan antes de espiar
        if (typeof global.crypto === 'undefined') {
            global.crypto = {};
        }
        if (typeof global.crypto.getRandomValues !== 'function') {
            global.crypto.getRandomValues = jest.fn();
        }
        // --- FIN DE LA CORRECCIÓN ---

        // Ahora es seguro espiar
        cryptoSpy = jest.spyOn(global.crypto, 'getRandomValues').mockImplementation(array => {
            array[0] = 0;
            return array;
        });
    });

    afterEach(() => {
        if (cryptoSpy) {
            cryptoSpy.mockRestore();
        }
    });

    test('constructor initializes properly', () => {
        expect(questionGen.setQuestion).toBe(setQuestion);
        expect(questionGen.questionsCache).toEqual([]);
        expect(questionGen.currentIndex).toBe(0);
        expect(questionGen.isFetching).toBe(false);
    });

    test('fetchQuestions should not proceed if already fetching', async () => {
        questionGen.isFetching = true;
        await questionGen.fetchQuestions();
        expect(global.fetch).not.toHaveBeenCalled();
        expect(setQuestion).not.toHaveBeenCalled();
        expect(questionGen.isFetching).toBe(true);
    });

    test('generateAndShuffleQuestions handles API success and processes data correctly', async () => {
        const mockData = {
            results: {
                bindings: [
                    { cityLabel: { value: 'Madrid' }, image: { value: 'http://example.com/madrid.jpg' } },
                    { cityLabel: { value: 'Paris' } },
                    { image: { value: 'http://example.com/london.jpg' } },
                    { cityLabel: { value: 'Rome' }, image: { value: 'http://example.com/rome.jpg' } },
                    { cityLabel: { value: 'Madrid' }, image: { value: 'http://example.com/madrid_duplicate.jpg' } },
                    { cityLabel: { value: 'Berlin' }, image: { value: 'http://server/berlin.png' } },
                ]
            }
        };

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockData)
        });

        const result = await questionGen.generateAndShuffleQuestions();

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('https://query.wikidata.org/sparql?query='),
            { headers: { 'Accept': 'application/sparql-results+json' } }
        );

        expect(result).toHaveLength(3);
        expect(result).toEqual(expect.arrayContaining([
            { city: 'Madrid', image: 'http://example.com/madrid_duplicate.jpg' },
            { city: 'Rome', image: 'http://example.com/rome.jpg' },
            { city: 'Berlin', image: 'http://server/berlin.png' }
        ]));
        expect(cryptoSpy).toHaveBeenCalled();
    });

    test('generateAndShuffleQuestions handles API fetch error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockRejectedValueOnce(new Error('API Fetch Error'));

        const result = await questionGen.generateAndShuffleQuestions();

        expect(result).toEqual([]);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching or processing Wikidata results:", expect.any(Error));
        consoleErrorSpy.mockRestore();
    });

    test('generateAndShuffleQuestions handles API non-ok response', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 404
        });

        const result = await questionGen.generateAndShuffleQuestions();

        expect(result).toEqual([]);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching or processing Wikidata results:", new Error("HTTP error! status: 404"));
        consoleErrorSpy.mockRestore();
    });

     test('generateAndShuffleQuestions handles empty bindings', async () => {
        const mockData = { results: { bindings: [] } };
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve(mockData)
        });

        const result = await questionGen.generateAndShuffleQuestions();

        expect(result).toEqual([]);
        expect(global.fetch).toHaveBeenCalledTimes(1);
     });

    test('getSecureRandom calls crypto.getRandomValues and returns number within range', () => {
        const max = 10;
        const result = questionGen.getSecureRandom(max);
        expect(result).toBe(0);
        expect(result).toBeLessThan(max);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(cryptoSpy).toHaveBeenCalledTimes(1);
        expect(cryptoSpy).toHaveBeenCalledWith(expect.any(Uint32Array));
    });

    test('shuffleArray calls crypto multiple times', () => {
        const originalArray = [1, 2, 3, 4, 5];
        const arrayToShuffle = [...originalArray];
        questionGen.shuffleArray(arrayToShuffle);
        expect(cryptoSpy).toHaveBeenCalledTimes(originalArray.length - 1);
    });

    test('getNextQuestion returns null when cache is empty or insufficient', () => {
        expect(questionGen.getNextQuestion()).toBeNull();

        questionGen.questionsCache = [{ city: 'A', image: 'a.jpg' }, { city: 'B', image: 'b.jpg' }];
        questionGen.currentIndex = 0;
        expect(questionGen.getNextQuestion()).toBeNull();
        // Crypto should not have been called again here, as it failed before reaching the random part
        expect(cryptoSpy).not.toHaveBeenCalled();
    });

    test('getNextQuestion returns a formatted question object and updates index', () => {
        const cache = [
            { city: 'Madrid', image: 'madrid.jpg' },
            { city: 'Paris', image: 'paris.jpg' },
            { city: 'London', image: 'london.jpg' },
            { city: 'Rome', image: 'rome.jpg' },
            { city: 'Berlin', image: 'berlin.jpg' }
        ];
        questionGen.questionsCache = [...cache];
        questionGen.currentIndex = 0;
        // Reset calls from beforeEach if needed for precise counting within this test
        cryptoSpy.mockClear();

        const question = questionGen.getNextQuestion();

        expect(question).not.toBeNull();
        expect(question).toHaveProperty('answers');
        expect(question).toHaveProperty('correct', 'Madrid');
        expect(Object.keys(question.answers)).toHaveLength(4);
        expect(question.answers).toEqual({
            'Madrid': 'madrid.jpg',
            'Paris': 'paris.jpg',
            'London': 'london.jpg',
            'Rome': 'rome.jpg'
        });
        expect(questionGen.currentIndex).toBe(4);
        expect(cryptoSpy).toHaveBeenCalledTimes(1);

        expect(questionGen.getNextQuestion()).toBeNull();
        expect(questionGen.currentIndex).toBe(4);
        expect(cryptoSpy).toHaveBeenCalledTimes(1); // No additional call
    });

    test('fetchQuestions fetches new questions when cache is low and sets question', async () => {
        const fetchedItems = [
            { city: 'CityA', image: 'a.jpg' }, { city: 'CityB', image: 'b.jpg' },
            { city: 'CityC', image: 'c.jpg' }, { city: 'CityD', image: 'd.jpg' },
            { city: 'CityE', image: 'e.jpg' },
        ];
        const mockData = { results: { bindings: fetchedItems.map(i => ({ cityLabel: { value: i.city }, image: { value: i.image } })) } };

        global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) });

        questionGen.questionsCache = [{ city: 'Old1', image: 'old1.jpg'}];
        questionGen.currentIndex = 0;

        await questionGen.fetchQuestions();

        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(questionGen.questionsCache).toHaveLength(fetchedItems.length);
        fetchedItems.forEach(item => {
            expect(questionGen.questionsCache).toContainEqual(item);
        });
        expect(questionGen.currentIndex).toBe(4);

        expect(setQuestion).toHaveBeenCalledTimes(1);
        const receivedQuestion = setQuestion.mock.calls[0][0];
        expect(receivedQuestion).toHaveProperty('correct');
        expect(receivedQuestion).toHaveProperty('answers');
        expect(Object.keys(receivedQuestion.answers)).toHaveLength(4);
        expect(receivedQuestion.answers).toHaveProperty(receivedQuestion.correct);
        Object.keys(receivedQuestion.answers).forEach(city => {
            expect(fetchedItems.some(item => item.city === city)).toBe(true);
        });

        expect(questionGen.isFetching).toBe(false);
    });

    test('fetchQuestions uses existing cache if sufficient and sets question', async () => {
         const cache = [
            { city: 'CacheA', image: 'ca.jpg' }, { city: 'CacheB', image: 'cb.jpg' },
            { city: 'CacheC', image: 'cc.jpg' }, { city: 'CacheD', image: 'cd.jpg' },
            { city: 'CacheE', image: 'ce.jpg' },
        ];
        questionGen.questionsCache = [...cache];
        questionGen.currentIndex = 0;

        await questionGen.fetchQuestions();

        expect(global.fetch).not.toHaveBeenCalled();
        expect(questionGen.currentIndex).toBe(4);

        expect(setQuestion).toHaveBeenCalledTimes(1);
        const receivedQuestion = setQuestion.mock.calls[0][0];
        expect(receivedQuestion).toHaveProperty('correct');
        expect(receivedQuestion.correct).toBe('CacheA');
        expect(receivedQuestion).toHaveProperty('answers');
        expect(Object.keys(receivedQuestion.answers)).toHaveLength(4);
        expect(receivedQuestion.answers).toEqual({
            'CacheA': 'ca.jpg', 'CacheB': 'cb.jpg',
            'CacheC': 'cc.jpg', 'CacheD': 'cd.jpg',
        });
        expect(questionGen.isFetching).toBe(false);
    });

     test('fetchQuestions sets question to null if getNextQuestion returns null after successful fetch (data < 4)', async () => {
         const mockData = { results: { bindings: [ { cityLabel: { value: 'A'}, image: { value: 'a.jpg'} } ] } };
         global.fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockData) });

         questionGen.questionsCache = [];
         questionGen.currentIndex = 0;

         await questionGen.fetchQuestions();

         expect(global.fetch).toHaveBeenCalledTimes(1);
         expect(questionGen.questionsCache).toHaveLength(1);
         expect(questionGen.currentIndex).toBe(0);

         expect(setQuestion).toHaveBeenCalledTimes(1);
         expect(setQuestion).toHaveBeenCalledWith(null);
         expect(questionGen.isFetching).toBe(false);
     });
});