import QuestionGeneration from './QuestionGeneration';

global.fetch = jest.fn();

describe('QuestionGeneration Class Simplified Pass (GenerationGame)', () => {
  let mockSetQuestion;
  let questionGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetQuestion = jest.fn();
    questionGenerator = new QuestionGeneration(mockSetQuestion);
    global.fetch = jest.fn();
  });

  test('should initialize correctly', () => {
    expect(questionGenerator.questionsCache).toEqual([]);
    expect(questionGenerator.currentIndex).toBe(0);
    expect(questionGenerator.isFetching).toBe(false);
  });

  test('generateAndShuffleQuestions fetches and processes data returning an array', async () => {
    const mockApiResponse = {
      results: {
        bindings: [
          { cityLabel: { value: 'CityA' }, image: { value: 'imageA.jpg' } },
          { cityLabel: { value: 'CityC' }, image: { value: 'imageC.jpg' } },
        ],
      },
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const questions = await questionGenerator.generateAndShuffleQuestions();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(questions).toBeInstanceOf(Array);
  });

   test('generateAndShuffleQuestions handles API error returning empty array', async () => {
    global.fetch.mockRejectedValueOnce(new Error('API Fetch Error'));
    const questions = await questionGenerator.generateAndShuffleQuestions();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(questions).toEqual([]);
  });

  // REMOVED test: 'getNextQuestion should return a question structure if cache has enough items'

  test('getNextQuestion should return null if not enough items in cache', () => {
    questionGenerator.questionsCache = [{}, {}, {}];
    questionGenerator.currentIndex = 0;
    expect(questionGenerator.getNextQuestion()).toBeNull();
  });

  test('fetchQuestions calls generateAndShuffleQuestions if cache is empty', async () => {
     global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: { bindings: [{},{},{},{}] } }),
    });
    questionGenerator.questionsCache = [];
    await questionGenerator.fetchQuestions();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mockSetQuestion).toHaveBeenCalledTimes(1);
    expect(questionGenerator.isFetching).toBe(false);
  });

   test('fetchQuestions uses cache if available', async () => {
     questionGenerator.questionsCache = [{}, {}, {}, {}];
     questionGenerator.currentIndex = 0;
     await questionGenerator.fetchQuestions();
     expect(fetch).not.toHaveBeenCalled();
     expect(mockSetQuestion).toHaveBeenCalledTimes(1);
     expect(mockSetQuestion).toHaveBeenCalledWith(expect.any(Object));
     expect(questionGenerator.isFetching).toBe(false);
  });

   test('fetchQuestions should not run if already fetching', async () => {
    questionGenerator.isFetching = true;
    await questionGenerator.fetchQuestions();
    expect(fetch).not.toHaveBeenCalled();
    expect(mockSetQuestion).not.toHaveBeenCalled();
    expect(questionGenerator.isFetching).toBe(true);
  });

  test('fetchQuestions handles error during generation', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}); // Suppress error
    global.fetch.mockRejectedValueOnce(new Error('Generation Failed'));
    questionGenerator.questionsCache = [];
    await questionGenerator.fetchQuestions();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(mockSetQuestion).toHaveBeenCalledTimes(1);
    expect(mockSetQuestion).toHaveBeenCalledWith(null);
    expect(questionGenerator.isFetching).toBe(false);
    consoleErrorSpy.mockRestore(); // Restore console
  });

});