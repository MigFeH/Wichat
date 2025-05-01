import QuestionGeneration from './QuestionGeneration';

global.fetch = jest.fn();

describe('QuestionGeneration Class Simplified', () => {
  let mockSetQuestion;
  let questionGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetQuestion = jest.fn();
    questionGenerator = new QuestionGeneration(mockSetQuestion);
    global.fetch = jest.fn();
  });

  test('should initialize correctly', () => {
    expect(questionGenerator.setQuestion).toBe(mockSetQuestion);
    expect(questionGenerator.questionsCache).toEqual([]);
    expect(questionGenerator.currentIndex).toBe(0);
    expect(questionGenerator.isFetching).toBe(false);
  });

  test('generateAndShuffleQuestions fetches and processes data', async () => {
    const mockApiResponse = {
      results: {
        bindings: [
          { cityLabel: { value: 'CityA' }, image: { value: 'imageA.jpg' } },
          { cityLabel: { value: 'Q123' }, image: { value: 'q123.jpg' } },
          { cityLabel: { value: 'CityC' }, image: { value: 'imageC.jpg' } },
          { cityLabel: { value: 'CityA' }, image: { value: 'imageA_duplicate.jpg' } }
        ],
      },
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const questions = await questionGenerator.generateAndShuffleQuestions();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("https://query.wikidata.org/sparql?query="), expect.any(Object));
    expect(questions).toHaveLength(3);
    expect(questions).toEqual(expect.arrayContaining([
      { city: 'CityA', image: 'imageA_duplicate.jpg' },
      { city: 'Q123', image: 'q123.jpg' },
      { city: 'CityC', image: 'imageC.jpg' },
    ]));
  });

   test('generateAndShuffleQuestions handles API error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch.mockRejectedValueOnce(new Error('API Fetch Error'));

    const questions = await questionGenerator.generateAndShuffleQuestions();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(questions).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  test('getNextQuestion returns null if cache has less than 4 items', () => {
    questionGenerator.questionsCache = [
      { city: 'CityA', image: 'imageA.jpg' },
      { city: 'CityB', image: 'imageB.jpg' },
    ];
    questionGenerator.currentIndex = 0;
    expect(questionGenerator.getNextQuestion()).toBeNull();
  });

  test('getNextQuestion returns a formatted question if cache has enough items', () => {
    questionGenerator.questionsCache = [
      { city: 'CityA', image: 'imageA.jpg' }, { city: 'CityB', image: 'imageB.jpg' },
      { city: 'CityC', image: 'imageC.jpg' }, { city: 'CityD', image: 'imageD.jpg' },
    ];
    questionGenerator.currentIndex = 0;

    const question = questionGenerator.getNextQuestion();

    expect(question).not.toBeNull();
    expect(question).toHaveProperty('correct');
    expect(question).toHaveProperty('answers');
    expect(Object.keys(question.answers)).toHaveLength(4);
    expect(question.answers).toHaveProperty(question.correct);
    expect(question.answers).toEqual({
        'CityA': 'imageA.jpg', 'CityB': 'imageB.jpg',
        'CityC': 'imageC.jpg', 'CityD': 'imageD.jpg'
    });
    expect(questionGenerator.currentIndex).toBe(4);
  });

  test('fetchQuestions calls generateAndShuffleQuestions if cache is empty and sets question', async () => {
    const mockGeneratedQuestions = [
      { city: 'GenA', image: 'genA.jpg' }, { city: 'GenB', image: 'genB.jpg' },
      { city: 'GenC', image: 'genC.jpg' }, { city: 'GenD', image: 'genD.jpg' }
    ];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: { bindings: mockGeneratedQuestions.map(q => ({cityLabel: {value: q.city}, image: {value: q.image}})) } }),
    });

    await questionGenerator.fetchQuestions();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(questionGenerator.questionsCache.length).toBe(mockGeneratedQuestions.length);

    expect(mockSetQuestion).toHaveBeenCalledTimes(1);
    const receivedQuestion = mockSetQuestion.mock.calls[0][0];
    expect(receivedQuestion).not.toBeNull();
    expect(receivedQuestion).toHaveProperty('correct');
    expect(receivedQuestion).toHaveProperty('answers');
    expect(Object.keys(receivedQuestion.answers)).toHaveLength(4);
    expect(receivedQuestion.answers).toHaveProperty(receivedQuestion.correct);

    expect(questionGenerator.isFetching).toBe(false);
  });

   test('fetchQuestions uses cache if available and sets question', async () => {
     const cache = [
      { city: 'CacheA', image: 'cacheA.jpg' }, { city: 'CacheB', image: 'cacheB.jpg' },
      { city: 'CacheC', image: 'cacheC.jpg' }, { city: 'CacheD', image: 'cacheD.jpg' }
    ];
    questionGenerator.questionsCache = [...cache];
    questionGenerator.currentIndex = 0;

    await questionGenerator.fetchQuestions();

    expect(fetch).not.toHaveBeenCalled();
    expect(mockSetQuestion).toHaveBeenCalledTimes(1);
    const receivedQuestion = mockSetQuestion.mock.calls[0][0];
     expect(receivedQuestion).not.toBeNull();
    expect(receivedQuestion).toHaveProperty('correct');
    expect(receivedQuestion).toHaveProperty('answers');
    expect(Object.keys(receivedQuestion.answers)).toHaveLength(4);
    expect(receivedQuestion.answers).toHaveProperty(receivedQuestion.correct);
     expect(receivedQuestion.answers).toEqual({
         'CacheA': 'cacheA.jpg', 'CacheB': 'cacheB.jpg',
         'CacheC': 'cacheC.jpg', 'CacheD': 'cacheD.jpg'
     });

    expect(questionGenerator.isFetching).toBe(false);
  });

   test('fetchQuestions should not run if already fetching', async () => {
    questionGenerator.isFetching = true;
    await questionGenerator.fetchQuestions();
    expect(fetch).not.toHaveBeenCalled();
    expect(mockSetQuestion).not.toHaveBeenCalled();
    expect(questionGenerator.isFetching).toBe(true);
  });

  test('fetchQuestions handles error during generation and sets question to null', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch.mockRejectedValueOnce(new Error('Generation Failed'));

    questionGenerator.questionsCache = [];
    questionGenerator.currentIndex = 0;

    await questionGenerator.fetchQuestions();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mockSetQuestion).toHaveBeenCalledTimes(1);
    expect(mockSetQuestion).toHaveBeenCalledWith(null);
    expect(questionGenerator.isFetching).toBe(false);
    expect(questionGenerator.questionsCache).toEqual([]);
    expect(questionGenerator.currentIndex).toBe(0);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});