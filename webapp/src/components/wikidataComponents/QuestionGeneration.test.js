import QuestionGeneration from './QuestionGeneration';

global.fetch = jest.fn();

describe('QuestionGeneration Class Simplified Pass', () => {
    let mockSetQuestion;
    let questionGenerator;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSetQuestion = jest.fn();
        questionGenerator = new QuestionGeneration(mockSetQuestion);
        global.fetch = jest.fn();
    });

    test('constructor initializes properly', () => {
        expect(questionGenerator.setQuestion).toBe(mockSetQuestion);
        expect(questionGenerator.questionsCache).toEqual([]);
        expect(questionGenerator.currentIndex).toBe(0);
        expect(questionGenerator.isFetching).toBe(false);
    });

    test('fetchQuestions should not proceed if already fetching', async () => {
        questionGenerator.isFetching = true;
        await questionGenerator.fetchQuestions();
        expect(global.fetch).not.toHaveBeenCalled();
        expect(mockSetQuestion).not.toHaveBeenCalled();
        expect(questionGenerator.isFetching).toBe(true);
    });

    test('generateAndShuffleQuestions handles API success', async () => {
         const mockData = {
            results: {
                bindings: [
                    { cityLabel: { value: 'CityA' }, image: { value: 'imageA.jpg' } },
                    { cityLabel: { value: 'Q123' }, image: { value: 'q123.jpg' } },
                    { cityLabel: { value: 'CityC' }, image: { value: 'imageC.jpg' } },
                ]
            }
        };
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });

        const result = await questionGenerator.generateAndShuffleQuestions();
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(result).toBeInstanceOf(Array);

    });

    test('generateAndShuffleQuestions handles API fetch error', async () => {
        global.fetch.mockRejectedValueOnce(new Error('API Fetch Error'));
        const result = await questionGenerator.generateAndShuffleQuestions();
        expect(result).toEqual([]);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('getNextQuestion returns null when cache is empty or insufficient', () => {
        expect(questionGenerator.getNextQuestion()).toBeNull();
        questionGenerator.questionsCache = [{}, {}, {}];
        expect(questionGenerator.getNextQuestion()).toBeNull();
    });

    test('getNextQuestion returns a question structure when cache is sufficient', () => {
        questionGenerator.questionsCache = [{}, {}, {}, {}];
        const question = questionGenerator.getNextQuestion();
        expect(question).not.toBeNull();
        expect(question).toHaveProperty('correct');
        expect(question).toHaveProperty('answers');
        expect(Object.keys(question.answers || {})).toHaveLength(1);
        expect(questionGenerator.currentIndex).toBe(4);
    });

    test('fetchQuestions calls generateAndShuffleQuestions if cache is empty', async () => {
        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: { bindings: [{},{},{},{}] } }),
        });
        questionGenerator.questionsCache = [];
        await questionGenerator.fetchQuestions();
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(mockSetQuestion).toHaveBeenCalledTimes(1);

        expect(questionGenerator.isFetching).toBe(false);
    });

    test('fetchQuestions uses cache if available', async () => {
        questionGenerator.questionsCache = [{}, {}, {}, {}];
        questionGenerator.currentIndex = 0;
        await questionGenerator.fetchQuestions();
        expect(global.fetch).not.toHaveBeenCalled();
        expect(mockSetQuestion).toHaveBeenCalledTimes(1);
        expect(mockSetQuestion).toHaveBeenCalledWith(expect.any(Object));
        expect(questionGenerator.isFetching).toBe(false);
    });

    test('fetchQuestions handles error during generation', async () => {
        global.fetch.mockRejectedValueOnce(new Error('Generation Failed'));
        questionGenerator.questionsCache = [];
        await questionGenerator.fetchQuestions();
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(mockSetQuestion).toHaveBeenCalledTimes(1);
        expect(mockSetQuestion).toHaveBeenCalledWith(null);
        expect(questionGenerator.isFetching).toBe(false);
    });
});