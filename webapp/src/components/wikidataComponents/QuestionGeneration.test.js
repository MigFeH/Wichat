import QuestionGeneration from './QuestionGeneration';

// Mock de fetch
global.fetch = jest.fn();

describe('QuestionGeneration', () => {
    let questionGen;
    let setQuestion;

    beforeEach(() => {
        setQuestion = jest.fn();
        questionGen = new QuestionGeneration(setQuestion);
        // Mock de window.crypto
        global.crypto = {
            getRandomValues: jest.fn(array => {
                array[0] = 123; // valor fijo para tests
                return array;
            })
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('constructor initializes properly', () => {
        expect(questionGen.setQuestion).toBe(setQuestion);
        expect(questionGen.questionsCache).toEqual([]);
        expect(questionGen.currentIndex).toBe(0);
        expect(questionGen.isFetching).toBe(false);
        expect(questionGen.currentCity).toBeNull();
    });

    test('fetchQuestions should not proceed if already fetching', async () => {
        questionGen.isFetching = true;
        await questionGen.fetchQuestions();
        expect(setQuestion).not.toHaveBeenCalled();
    });

    test('generateQuestions handles API success', async () => {
        const mockData = {
            results: {
                bindings: [
                    {
                        cityLabel: { value: 'Madrid' },
                        image: { value: 'http://example.com/madrid.jpg' }
                    }
                ]
            }
        };

        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve(mockData)
        });

        const result = await questionGen.generateQuestions();
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            city: 'Madrid',
            image: 'http://example.com/madrid.jpg'
        });
    });

    test('generateQuestions handles API error', async () => {
        global.fetch.mockRejectedValueOnce(new Error('API Error'));
        const result = await questionGen.generateQuestions();
        expect(result).toEqual([]);
    });

    test('getSecureRandom returns number within range', () => {
        const result = questionGen.getSecureRandom(10);
        expect(result).toBeLessThan(10);
        expect(result).toBeGreaterThanOrEqual(0);
    });

    test('getNextQuestion returns null when cache is empty', () => {
        expect(questionGen.getNextQuestion()).toBeNull();
    });

    test('getNextQuestion returns question object when cache has items', () => {
        questionGen.questionsCache = [
            { city: 'Madrid', image: 'madrid.jpg' },
            { city: 'Paris', image: 'paris.jpg' },
            { city: 'London', image: 'london.jpg' },
            { city: 'Rome', image: 'rome.jpg' }
        ];

        const question = questionGen.getNextQuestion();
        expect(question).toHaveProperty('answers');
        expect(question).toHaveProperty('correct');
        expect(Object.keys(question.answers)).toHaveLength(4);
    });

    test('getCurrentCity returns current city', () => {
        questionGen.currentCity = 'Madrid';
        expect(questionGen.getCurrentCity()).toBe('Madrid');
    });

    test('fetchQuestions complete flow', async () => {
        const mockData = {
            results: {
                bindings: Array(5).fill({
                    cityLabel: { value: 'TestCity' },
                    image: { value: 'test.jpg' }
                })
            }
        };

        global.fetch.mockResolvedValueOnce({
            json: () => Promise.resolve(mockData)
        });

        await questionGen.fetchQuestions();
        expect(setQuestion).toHaveBeenCalled();
        expect(questionGen.isFetching).toBe(false);
    });
});