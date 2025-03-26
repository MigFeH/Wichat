const request = require('supertest');
const bcrypt = require('bcrypt');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('./user-model');
const GameStats = require('./game-stats-model');

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  app = require('./user-service');
});

afterAll(async () => {
  await app.close();
  await mongoServer.stop();
});

describe('User Service', () => {
  
  it('should add a new user on POST /adduser', async () => {
    const newUser = {
      username: 'testuser',
      password: 'testpassword',
    };

    const response = await request(app).post('/adduser').send(newUser);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'testuser');

    const userInDb = await User.findOne({ username: 'testuser' });
    expect(userInDb).not.toBeNull();
    expect(userInDb.username).toBe('testuser');

    const isPasswordValid = await bcrypt.compare('testpassword', userInDb.password);
    expect(isPasswordValid).toBe(true);

    expect(userInDb).toHaveProperty('_id');
    expect(userInDb.password).not.toBe('testpassword');
  });

  it('should return a 400 error if missing required fields on POST /adduser', async () => {
    const newUser = {
      username: 'testuser',
    };

    const response = await request(app).post('/adduser').send(newUser);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing required field: password');
  });

  it('should handle missing fields correctly on POST /api/stats', async () => {
    const response = await request(app).post('/api/stats').send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    expect(response.body.message).toBe('Faltan campos requeridos: correctAnswers, incorrectAnswers, totalRounds');
  });

  it('should save game statistics on POST /api/stats', async () => {
    const statsData = {
      correctAnswers: 8,
      incorrectAnswers: 2,
      totalRounds: 10,
    };

    const response = await request(app).post('/api/stats').send(statsData);
    expect(response.status).toBe(201);
    expect(response.body.correctAnswers).toBe(statsData.correctAnswers);
    expect(response.body.accuracy).toBe(80);

    const savedStats = await GameStats.findOne({ correctAnswers: 8 });
    expect(savedStats).not.toBeNull();
    expect(savedStats.accuracy).toBe(80);
  });

  it('should get game statistics on GET /api/stats', async () => {
    const statsData = {
      correctAnswers: 5,
      incorrectAnswers: 5,
      totalRounds: 10,
    };

    await request(app).post('/api/stats').send(statsData);

    const response = await request(app).get('/api/stats').query({ limit: 10 });
    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toHaveProperty('correctAnswers', 5);
    expect(response.body[0]).toHaveProperty('accuracy', 50);
  });

});
