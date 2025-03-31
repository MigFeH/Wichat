const request = require('supertest');

// Mock QuestionGeneration module
const mockFetchQuestions = jest.fn();
const mockGetNextQuestion = jest.fn();

jest.mock('./QuestionGeneration', () => {
    return jest.fn().mockImplementation(() => ({
        fetchQuestions: mockFetchQuestions,
        getNextQuestion: mockGetNextQuestion
    }));
});

describe('Question Server', () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.NODE_ENV = 'test';
        app = require('./serverQuestions');
    });

    afterEach(() => {
        jest.resetModules();
    });

    test('should have CORS configured', async () => {
        const response = await request(app)
            .get('/questions')
            .set('Origin', 'http://localhost:3000');
        
        expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    test('should return question when available', async () => {
        const mockQuestion = {
            answers: { "Madrid": "madrid.jpg" },
            correct: "Madrid"
        };
        
        mockFetchQuestions.mockResolvedValueOnce();
        mockGetNextQuestion.mockReturnValueOnce(mockQuestion);

        const response = await request(app)
            .get('/questions')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toEqual(mockQuestion);
        expect(mockFetchQuestions).toHaveBeenCalled();
        expect(mockGetNextQuestion).toHaveBeenCalled();
    });

    test('should return 404 when no questions available', async () => {
        mockFetchQuestions.mockResolvedValueOnce();
        mockGetNextQuestion.mockReturnValueOnce(null);

        const response = await request(app)
            .get('/questions')
            .expect('Content-Type', /json/)
            .expect(404);

        expect(response.body).toEqual({ error: "No questions available" });
    });

    test('should return 500 on error', async () => {
        mockFetchQuestions.mockRejectedValueOnce(new Error('Test error'));

        const response = await request(app)
            .get('/questions')
            .expect('Content-Type', /json/)
            .expect(500);

        expect(response.body).toEqual({ error: "Error generating questions" });
    });
});