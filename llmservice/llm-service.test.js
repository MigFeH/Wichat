const request = require('supertest');
const axios = require('axios');
// --- Tu importación original que funciona ---
const app = require('./llm-service');

// Mockear axios globalmente
jest.mock('axios');

// Mockear console (opcional, descomenta si no quieres ver logs en los tests)
// global.console = { log: jest.fn(), error: jest.fn(), /* ... */ };

describe('LLM Hint API (/hint) - Extended Tests', () => {
  // --- Datos de prueba consistentes ---
  const mockApiKey = 'test-api-key';
  const mockCity = 'TestCity';
  const mockUserInput = 'Dame una pista';
  const mockQuestion = `${mockCity}:${mockUserInput}`;

  // Limpiar mocks de axios después de cada test
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Cerrar el servidor usando la instancia 'app' importada
  afterAll((done) => {
    if (app && app.close) {
      app.close(done);
    } else {
      console.warn('Server instance (app) not found or cannot be closed. Ensure llm-service.js exports the server.');
      done();
    }
  });

  // --- Tests detallados ---

  test('should call Gemini API correctly via /hint route', async () => {
    const mockGeminiResponse = {
      data: { candidates: [{ content: { parts: [{ text: 'Respuesta Gemini' }] } }] },
    };
    axios.post.mockResolvedValueOnce(mockGeminiResponse);

    // --- Usa request(app) ---
    await request(app)
      .post('/hint')
      .send({ question: mockQuestion, model: 'gemini', apiKey: mockApiKey })
      .expect(200);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('generativelanguage.googleapis.com'),
      expect.objectContaining({
        contents: expect.arrayContaining([
          expect.objectContaining({
            parts: expect.arrayContaining([
              expect.objectContaining({ text: expect.any(String) }),
              expect.objectContaining({ text: mockQuestion }),
            ]),
          }),
        ]),
      }),
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } })
    );
  });

  test('should return 400 for unsupported model via /hint route', async () => {
    // --- Usa request(app) ---
    await request(app)
      .post('/hint')
      .send({ question: mockQuestion, model: 'unsupported_model', apiKey: mockApiKey })
      .expect(400)
      .then((res) => {
         expect(res.body.error).toContain('An error occurred');
      });
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('should return 400 on axios failure via /hint route', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network Error'));

    // --- Usa request(app) ---
    await request(app)
      .post('/hint')
      .send({ question: mockQuestion, model: 'gemini', apiKey: mockApiKey })
      .expect(400)
      .then((res) => {
        expect(res.body.error).toContain('An error occurred');
      });
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  test('should handle axios error without message property via /hint route', async () => {
    axios.post.mockRejectedValueOnce({ code: 'ECONNREFUSED' });

    // --- Usa request(app) ---
    await request(app)
      .post('/hint')
      .send({ question: mockQuestion, model: 'gemini', apiKey: mockApiKey })
      .expect(400)
      .then((res) => {
        expect(res.body.error).toContain('An error occurred');
      });
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  test('should return original response if city name is not in LLM answer', async () => {
    const mockResponseText = 'Esta es una pista sobre un lugar.';
    axios.post.mockResolvedValueOnce({
      data: { candidates: [{ content: { parts: [{ text: mockResponseText }] } }] },
    });

    // --- Usa request(app) ---
    await request(app)
      .post('/hint')
      .send({ question: mockQuestion, model: 'gemini', apiKey: mockApiKey })
      .expect(200)
      .then((res) => {
        expect(res.body.answer).toBe(mockResponseText);
      });
  });

  test('should return filtered response if city name is present in LLM answer (case-insensitive)', async () => {
    const mockResponseText = `Sí, es ${mockCity}! Buen trabajo!`;
    axios.post.mockResolvedValueOnce({
      data: { candidates: [{ content: { parts: [{ text: mockResponseText }] } }] },
    });
    const questionWithLowerCity = `testcity:${mockUserInput}`;

    // --- Usa request(app) ---
    await request(app)
      .post('/hint')
      .send({ question: questionWithLowerCity, model: 'gemini', apiKey: mockApiKey })
      .expect(200)
      .then((res) => {
        expect(res.body.answer).toContain('Lo siento, tu pregunta ha revelado accidentalmente');
      });
  });

  test('POST /hint should return 200 and answer for valid request (gemini)', async () => {
    const mockResponseText = 'Pista para Gemini.';
    axios.post.mockResolvedValueOnce({
      data: { candidates: [{ content: { parts: [{ text: mockResponseText }] } }] },
    });

    // --- Usa request(app) ---
    const response = await request(app)
      .post('/hint')
      .send({ question: mockQuestion, model: 'gemini', apiKey: mockApiKey })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({ answer: mockResponseText });
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  test('POST /hint should return 200 and answer for valid request (empathy)', async () => {
     const mockResponseText = 'Pista para Empathy.';
    axios.post.mockResolvedValueOnce({
      data: { choices: [{ message: { content: mockResponseText } }] },
    });

    // --- Usa request(app) ---
    const response = await request(app)
      .post('/hint')
      .send({ question: mockQuestion, model: 'empathy', apiKey: mockApiKey })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({ answer: mockResponseText });
    expect(axios.post).toHaveBeenCalledTimes(1);
  });


  test('POST /hint should return 400 if question is missing', async () => {
    // --- Usa request(app) ---
    const response = await request(app)
      .post('/hint')
      .send({ model: 'gemini', apiKey: mockApiKey })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toMatch(/Missing required field: question|An error occurred/i);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('POST /hint should return 400 if model is missing', async () => {
    // --- Usa request(app) ---
     const response = await request(app)
      .post('/hint')
      .send({ question: mockQuestion, apiKey: mockApiKey })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toMatch(/Missing required field: model|An error occurred/i);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('POST /hint should return 400 if apiKey is missing', async () => {
    // --- Usa request(app) ---
    const response = await request(app)
      .post('/hint')
      .send({ question: mockQuestion, model: 'gemini' })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toMatch(/Missing required field: apiKey|An error occurred/i);
    expect(axios.post).not.toHaveBeenCalled();
  });

   test('POST /hint should return 400 if LLM response is null (leading to validation error)', async () => {
     axios.post.mockResolvedValueOnce({ data: { candidates: [] } });

    // --- Usa request(app) ---
    const response = await request(app)
      .post('/hint')
      .send({ question: mockQuestion, model: 'gemini', apiKey: mockApiKey })
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('An error occurred');
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

});