const request = require('supertest');
const axios = require('axios');
const app = require('./gateway-service'); 

afterAll(async () => {
    app.close();
  });

jest.mock('axios');

describe('Gateway Service', () => {
  // Mock responses from external services
  axios.post.mockImplementation((url, data) => {
    if (url.endsWith('/login')) {
      return Promise.resolve({ data: { token: 'mockedToken' } });
    } else if (url.endsWith('/adduser')) {
      return Promise.resolve({ data: { userId: 'mockedUserId' } });
    } else if (url.endsWith('/hint')) {
      return Promise.resolve({ data: { answer: 'llmanswer' } });
    }else if (url.endsWith('/questions')) {
      return Promise.resolve({data: {answer: 'questionAnswer'}})
    }else if (url.endsWith('/api/stats')){
      return Promise.resolve({data: {answer: 'apiStats'}})
    }
  });

  it('should forward a health request', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
  });

  it('should forward login request to auth service', async () => {
    const response = await request(app)
        .post('/login')
        .send({ username: 'testuser', password: 'testpassword' });
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBe('mockedToken');
  });

  it('should fail login with missing credentials', async () => {
    const response = await request(app)
        .post('/login');


    expect(response.body.error).toBe();
  });

  it('should forward add user request to user service', async () => {
    const response = await request(app)
        .post('/adduser')
        .send({ username: 'newuser', password: 'newpassword' });
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBe('mockedUserId' );
  });

  it('should fail add user with missing data', async () => {
    const response = await request(app)
        .post('/adduser');

    expect(response.body.error).toBe();
  });

  it('should forward askllm request to the LLM service', async () => {
    const response = await request(app)
        .post('/hint')
        .send({ question: 'question', model: 'gemini', apiKey: 'apiKey' });
    expect(response.statusCode).toBe(200);
    expect(response.body.data).toBe('llmanswer');
  });

  it('should fail askllm with missing parameters', async () => {
    const response = await request(app)
        .post('/hint');

    expect(response.body.error).toBe();
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown');
    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Wrong URL: Please, check the correct enpoint URL');
  });

});