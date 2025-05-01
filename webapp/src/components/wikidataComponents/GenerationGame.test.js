import QuestionGeneration from './QuestionGeneration';

// Mock fetch globally
global.fetch = jest.fn();

// Mock global crypto using spyOn
let cryptoSpy;

describe('QuestionGeneration Class', () => {
  let mockSetQuestion;
  let questionGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetQuestion = jest.fn();
    questionGenerator = new QuestionGeneration(mockSetQuestion);
    global.fetch = jest.fn(); // Ensure fetch mock is reset

    // Set up the spy on crypto.getRandomValues
    cryptoSpy = jest.spyOn(global.crypto, 'getRandomValues').mockImplementation(array => {
        array[0] = 0; // Predictable index 0
        return array;
    });
  });

  afterEach(() => {
     if (cryptoSpy) {
        cryptoSpy.mockRestore();
     }
  });

  test('should initialize with empty cache and index 0', () => {
    expect(questionGenerator.questionsCache).toEqual([]);
    expect(questionGenerator.currentIndex).toBe(0);
    expect(questionGenerator.isFetching).toBe(false);
    // Removed check for non-existent currentCity
  });

  // Test the method that actually exists and fetches data
  test('generateAndShuffleQuestions should fetch and process data correctly', async () => {
    const mockApiResponse = {
      results: {
        bindings: [
          { cityLabel: { value: 'CityA' }, image: { value: 'imageA.jpg' } },
          { cityLabel: { value: 'CityB' }, image: { value: 'imageB.jpg' } },
          { cityLabel: { value: 'CityC' }, image: { value: 'imageC.jpg' } },
          { cityLabel: { value: 'CityD' }, image: { value: 'imageD.jpg' } },
          { cityLabel: { value: 'CityE' }, image: { value: 'imageE.jpg' } },
        ],
      },
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    // Call the correct method
    const questions = await questionGenerator.generateAndShuffleQuestions();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("https://query.wikidata.org/sparql?query="), expect.objectContaining({ headers: { 'Accept': 'application/sparql-results+json' } }));
    // Check length and content (order might differ due to shuffle)
    expect(questions).toHaveLength(5);
    expect(questions).toEqual(expect.arrayContaining([
      { city: 'CityA', image: 'imageA.jpg' },
      { city: 'CityB', image: 'imageB.jpg' },
      { city: 'CityC', image: 'imageC.jpg' },
      { city: 'CityD', image: 'imageD.jpg' },
      { city: 'CityE', image: 'imageE.jpg' },
    ]));
    expect(cryptoSpy).toHaveBeenCalled(); // Shuffle was called
  });

   test('generateAndShuffleQuestions should handle API error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch.mockRejectedValueOnce(new Error('API Fetch Error'));

    // Call the correct method
    const questions = await questionGenerator.generateAndShuffleQuestions();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(questions).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching or processing Wikidata results:", expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  test('getNextQuestion should return a formatted question and update index', () => {
    const cache = [
      { city: 'CityA', image: 'imageA.jpg' }, { city: 'CityB', image: 'imageB.jpg' },
      { city: 'CityC', image: 'imageC.jpg' }, { city: 'CityD', image: 'imageD.jpg' },
      { city: 'CityE', image: 'imageE.jpg' }, { city: 'CityF', image: 'imageF.jpg' },
      { city: 'CityG', image: 'imageG.jpg' }, { city: 'CityH', image: 'imageH.jpg' },
    ];
    questionGenerator.questionsCache = [...cache];
    questionGenerator.currentIndex = 0;

    const question = questionGenerator.getNextQuestion();

    const expectedCorrectCity = 'CityA'; // Based on crypto mock returning index 0
    const expectedAnswers = {
        'CityA': 'imageA.jpg', 'CityB': 'imageB.jpg',
        'CityC': 'imageC.jpg', 'CityD': 'imageD.jpg',
    };

    expect(question).toEqual({
      answers: expectedAnswers,
      correct: expectedCorrectCity,
    });
    expect(questionGenerator.currentIndex).toBe(4);
    expect(cryptoSpy).toHaveBeenCalledTimes(1);

    // Get second question
    const question2 = questionGenerator.getNextQuestion();
    const expectedCorrectCity2 = 'CityE'; // Index 0 of the second slice [E, F, G, H]
    const expectedAnswers2 = {
        'CityE': 'imageE.jpg', 'CityF': 'imageF.jpg',
        'CityG': 'imageG.jpg', 'CityH': 'imageH.jpg',
    };

    expect(question2).toEqual({
        answers: expectedAnswers2,
        correct: expectedCorrectCity2,
    });
    expect(questionGenerator.currentIndex).toBe(8);
    expect(cryptoSpy).toHaveBeenCalledTimes(2); // Called again
  });

  test('getNextQuestion should return null if not enough items in cache', () => {
    const initialCache = [
      { city: 'CityA', image: 'imageA.jpg' },
      { city: 'CityB', image: 'imageB.jpg' },
    ];
    questionGenerator.questionsCache = [...initialCache]; // Use a copy
    questionGenerator.currentIndex = 0;

    expect(questionGenerator.getNextQuestion()).toBeNull();
    // Cache should NOT be cleared, just couldn't get a question
    expect(questionGenerator.questionsCache).toEqual(initialCache);
    expect(cryptoSpy).not.toHaveBeenCalled(); // Random shouldn't be called
  });

  test('fetchQuestions should call generateAndShuffleQuestions if cache is empty and set question', async () => {
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
    mockGeneratedQuestions.forEach(item => {
        expect(questionGenerator.questionsCache).toContainEqual(item);
    });

    expect(mockSetQuestion).toHaveBeenCalledTimes(1);
    const receivedQuestion = mockSetQuestion.mock.calls[0][0];
    expect(receivedQuestion).toHaveProperty('correct');
    expect(receivedQuestion).toHaveProperty('answers');
    expect(Object.keys(receivedQuestion.answers)).toHaveLength(4);
    expect(receivedQuestion.answers).toHaveProperty(receivedQuestion.correct); // Correct answer must be one of the options

    expect(questionGenerator.isFetching).toBe(false);
  });

   test('fetchQuestions should use cache if available and set question', async () => {
     const cache = [
      { city: 'CacheA', image: 'cacheA.jpg' }, { city: 'CacheB', image: 'cacheB.jpg' },
      { city: 'CacheC', image: 'cacheC.jpg' }, { city: 'CacheD', image: 'cacheD.jpg' }
    ];
    questionGenerator.questionsCache = [...cache];
    questionGenerator.currentIndex = 0;

    await questionGenerator.fetchQuestions();

    expect(fetch).not.toHaveBeenCalled();
    expect(mockSetQuestion).toHaveBeenCalledTimes(1);
    const expectedQuestionFormat = {
        answers: {
            'CacheA': 'cacheA.jpg', 'CacheB': 'cacheB.jpg',
            'CacheC': 'cacheC.jpg', 'CacheD': 'cacheD.jpg'
        },
        correct: 'CacheA' // Because crypto mock => index 0, and no shuffle happened
    };
    expect(mockSetQuestion).toHaveBeenCalledWith(expectedQuestionFormat);
    expect(questionGenerator.isFetching).toBe(false);
  });

   test('fetchQuestions should not run if already fetching', async () => {
    questionGenerator.isFetching = true;
    await questionGenerator.fetchQuestions();
    expect(fetch).not.toHaveBeenCalled();
    expect(mockSetQuestion).not.toHaveBeenCalled();
    expect(questionGenerator.isFetching).toBe(true); // State remains fetching
  });

  // Removed test for non-existent getCurrentCity
});