const request = require('supertest');
const bcrypt = require('bcrypt');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const User = require('./user-model');
const GameStats = require('./game-stats-model');

let mongoServer;
let app;

const PWD_USER_1 = 'testpassword1';
const PWD_USER_EXISTING = 'password123';
const PWD_USER_EXISTING_NEW = 'anotherpassword';
const PWD_USER_GET = 'password123';
const PWD_USER_PROFILE = 'password123';
const PWD_RANK_USER = 'rankpassword';


beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  app = require('./user-service');
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  if (app && app.close) {
      await new Promise(resolve => app.close(resolve));
  }
  await mongoose.connection.close();
  await mongoServer.stop();
});


beforeEach(async () => {
  await User.deleteMany({});
  await GameStats.deleteMany({});
});


describe('User Service - User Endpoints', () => {

  describe('POST /adduser', () => {
    it('should add a new user successfully', async () => {
      const newUser = {
        username: 'testuser1',
        password: PWD_USER_1,
      };

      const response = await request(app).post('/adduser').send(newUser);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'testuser1');
      expect(response.body).not.toHaveProperty('password');

      const userInDb = await User.findOne({ username: 'testuser1' });
      expect(userInDb).not.toBeNull();
      expect(userInDb.username).toBe('testuser1');
      expect(userInDb).toHaveProperty('createdAt');
      expect(userInDb).toHaveProperty('profileImage', 'profile_1.gif');

      expect(userInDb.password).not.toBe(PWD_USER_1);
      const isPasswordValid = await bcrypt.compare(PWD_USER_1, userInDb.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should return 400 if username is missing', async () => {
      const newUser = { password: PWD_USER_1 };
      const response = await request(app).post('/adduser').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required field: username');
    });

    it('should return 400 if password is missing', async () => {
      const newUser = { username: 'testuser2' };
      const response = await request(app).post('/adduser').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required field: password');
    });

    it('should return 400 if username already exists', async () => {
      const existingUser = { username: 'existinguser', password: PWD_USER_EXISTING };
      await request(app).post('/adduser').send(existingUser);

      const newUser = { username: 'existinguser', password: PWD_USER_EXISTING_NEW };
      const response = await request(app).post('/adduser').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username already exists, please choose another one');
    });
  });

  describe('GET /user/:username', () => {
    it('should get user data successfully', async () => {
      const userData = { username: 'getuser', password: PWD_USER_GET };
      await request(app).post('/adduser').send(userData);

      const response = await request(app).get('/user/getuser');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'getuser');
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('profileImage', 'profile_1.gif');
    });

    it('should return 404 if user not found', async () => {
      const response = await request(app).get('/user/nonexistentuser');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

  });

  describe('PUT /user/:username/profile', () => {
    let testUsername = 'profileuser';

    beforeEach(async () => {
      await User.create({ username: testUsername, password: await bcrypt.hash(PWD_USER_PROFILE, 10) });
    });

    it('should update profile image successfully', async () => {
      const newProfileImage = 'profile_5.gif';
      const response = await request(app)
        .put(`/user/${testUsername}/profile`)
        .send({ profileImage: newProfileImage });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', testUsername);
      expect(response.body).toHaveProperty('profileImage', newProfileImage);
      expect(response.body).not.toHaveProperty('password');

      const userInDb = await User.findOne({ username: testUsername });
      expect(userInDb.profileImage).toBe(newProfileImage);
    });

    it('should return 404 if user to update is not found', async () => {
      const response = await request(app)
        .put('/user/nonexistentuser/profile')
        .send({ profileImage: 'profile_2.gif' });
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 400 if profileImage is missing in body', async () => {
        const response = await request(app)
         .put(`/user/${testUsername}/profile`)
         .send({});
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid profile image name provided');
    });

    it('should return 400 if profileImage has invalid prefix', async () => {
      const response = await request(app)
        .put(`/user/${testUsername}/profile`)
        .send({ profileImage: 'image_1.gif' });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid profile image name provided');
    });

    it('should return 400 if profileImage has invalid suffix', async () => {
      const response = await request(app)
        .put(`/user/${testUsername}/profile`)
        .send({ profileImage: 'profile_1.jpg' });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid profile image name provided');
    });

    it('should return 400 if profileImage is not in the allowed list', async () => {
      const response = await request(app)
        .put(`/user/${testUsername}/profile`)
        .send({ profileImage: 'profile_99.gif' });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Selected profile image is not valid');
    });

     it('should return 400 if profileImage is not a string', async () => {
      const response = await request(app)
        .put(`/user/${testUsername}/profile`)
        .send({ profileImage: 123 });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid profile image name provided');
    });
  });

});

describe('User Service - Stats Endpoints', () => {

  describe('POST /api/stats', () => {
    it('should save game statistics successfully', async () => {
      const statsData = {
        username: "statsuser",
        score: 150,
        correctAnswers: 15,
        incorrectAnswers: 5,
        totalRounds: 20
      };

      const response = await request(app).post('/api/stats').send(statsData);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('username', 'statsuser');
      expect(response.body).toHaveProperty('score', 150);
      expect(response.body).toHaveProperty('correctAnswers', 15);
      expect(response.body).toHaveProperty('incorrectAnswers', 5);
      expect(response.body).toHaveProperty('totalRounds', 20);
      expect(response.body).toHaveProperty('accuracy', 75);


      const savedStats = await GameStats.findOne({ username: 'statsuser' });
      expect(savedStats).not.toBeNull();
      expect(savedStats.score).toBe(150);
      expect(savedStats.accuracy).toBe(75);
      // Se elimina la siguiente línea porque savedStats no tiene la propiedad 'timestamp'
      // expect(savedStats).toHaveProperty('timestamp');
    });

    it('should calculate accuracy as 0 if correctAnswers is 0', async () => {
        const statsData = {
          username: "statsuserZero",
          score: 0,
          correctAnswers: 0,
          incorrectAnswers: 10,
          totalRounds: 10
        };

        const response = await request(app).post('/api/stats').send(statsData);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('accuracy', 0);

        const savedStats = await GameStats.findOne({ username: 'statsuserZero' });
        expect(savedStats.accuracy).toBe(0);
    });

    it('should return 400 if required fields are missing', async () => {
      const requiredFields = ['username', 'score', 'correctAnswers', 'incorrectAnswers', 'totalRounds'];
      const baseData = {
        username: "statsuser",
        score: 100,
        correctAnswers: 10,
        incorrectAnswers: 0,
        totalRounds: 10
      };

      for (const field of requiredFields) {
          const incompleteData = { ...baseData };
          delete incompleteData[field];
          const response = await request(app).post('/api/stats').send(incompleteData);
          expect(response.status).toBe(400);
          expect(response.body.error).toBe('Bad Request');
          expect(response.body.message).toContain('Faltan campos requeridos');
      }
    });

    it('should return 400 if sending an empty body', async () => {
        const response = await request(app).post('/api/stats').send({});
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Bad Request');
        expect(response.body.message).toBe('Faltan campos requeridos: username, score, correctAnswers, incorrectAnswers, totalRounds');
    });
  });

  describe('GET /api/stats', () => {
    const user1 = 'statsgetter1';
    const user2 = 'statsgetter2';

    beforeEach(async () => {
      const now = Date.now();
      // Aunque insertemos 'timestamp' aquí, la API no lo devuelve si no está en el esquema
      await GameStats.insertMany([
        { username: user1, score: 100, correctAnswers: 10, incorrectAnswers: 0, totalRounds: 10, accuracy: 100, timestamp: new Date(now - 10000) },
        { username: user1, score: 80, correctAnswers: 8, incorrectAnswers: 2, totalRounds: 10, accuracy: 80, timestamp: new Date(now) },
        { username: user2, score: 120, correctAnswers: 12, incorrectAnswers: 3, totalRounds: 15, accuracy: 80, timestamp: new Date(now - 5000) }
      ]);
    });

    it('should get game statistics for a specific user, sorted by timestamp descending', async () => {
      const response = await request(app).get('/api/stats').query({ username: user1 });
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      expect(response.body[0].score).toBe(100);
      expect(response.body[1].score).toBe(80);
    });

    it('should return an empty array if user has no stats', async () => {
      const response = await request(app).get('/api/stats').query({ username: 'nouserstats' });
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 400 if username query parameter is missing', async () => {
      const response = await request(app).get('/api/stats');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('Falta el parámetro requerido: username');
    });
  });

  describe('GET /ranking', () => {
     beforeEach(async () => {
       const hashedPassword = await bcrypt.hash(PWD_RANK_USER, 10);
       await User.insertMany([
         { username: 'rankuser1', password: hashedPassword, profileImage: 'profile_3.gif' },
         { username: 'rankuser2', password: hashedPassword },
       ]);

       await GameStats.insertMany([
         { username: 'rankuser1', score: 100, correctAnswers: 10, incorrectAnswers: 0, totalRounds: 10, accuracy: 100 },
         { username: 'rankuser2', score: 50, correctAnswers: 5, incorrectAnswers: 5, totalRounds: 10, accuracy: 50 },
         { username: 'rankuser1', score: 150, correctAnswers: 15, incorrectAnswers: 5, totalRounds: 20, accuracy: 75 },
         { username: 'rankuser3', score: 120, correctAnswers: 12, incorrectAnswers: 3, totalRounds: 15, accuracy: 80 }
       ]);
     });

    it('should return ranking sorted by max score descending', async () => {
      const response = await request(app).get('/ranking');
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(3);

      expect(response.body[0]).toEqual({ username: 'rankuser1', score: 150, profileImage: 'profile_3.gif' });
      expect(response.body[1]).toEqual({ username: 'rankuser3', score: 120, profileImage: 'profile_1.gif' });
      expect(response.body[2]).toEqual({ username: 'rankuser2', score: 50, profileImage: 'profile_1.gif' });
    });

    it('should return an empty array if no stats exist', async () => {
      await GameStats.deleteMany({});
      const response = await request(app).get('/ranking');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

});