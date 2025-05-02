const request = require('supertest');
const bcrypt = require('bcrypt');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const User = require('./user-model');
const GameStats = require('./game-stats-model');

let mongoServer;
let app; // Declara app aquí para que esté en el scope de beforeAll y afterAll

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

  // Importa la app DESPUÉS de configurar la URI de mongo y ANTES de conectar Mongoose
  app = require('./user-service');
  // Conecta Mongoose después de importar la app si la conexión está en user-service.js
  // Si la conexión se realiza al requerir 'app', asegúrate de que la URI esté lista antes.
  // Espera a que la conexión se complete si es necesario (puede que ya lo haga internamente)
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Cierra el servidor de la app primero
  if (app && app.close) {
      await new Promise(resolve => app.close(resolve)); // Correcto para cerrar servidor Express
  }
  // Luego cierra la conexión de Mongoose
  await mongoose.connection.close();
  // Finalmente detiene el servidor de memoria de MongoDB
  await mongoServer.stop();
});

beforeEach(async () => {
  // Limpia las colecciones antes de cada test
  await User.deleteMany({});
  await GameStats.deleteMany({});
  // Restaura todos los mocks de jest si usas spies
  jest.restoreAllMocks();
});


describe('User Service - User Endpoints', () => {

  describe('POST /adduser', () => {
    it('should add a new user successfully', async () => {
      const newUser = { username: 'testuser1', password: PWD_USER_1 };
      const response = await request(app).post('/adduser').send(newUser);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'testuser1');
      expect(response.body).not.toHaveProperty('password');

      const userInDb = await User.findOne({ username: 'testuser1' });
      expect(userInDb).not.toBeNull();
      expect(userInDb.username).toBe('testuser1');
      expect(userInDb.createdAt).toBeInstanceOf(Date);
      expect(userInDb.profileImage).toBe('profile_1.gif');
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
      await User.create(existingUser); // Crea directamente en DB para aislar el test
      const newUser = { username: 'existinguser', password: PWD_USER_EXISTING_NEW };
      const response = await request(app).post('/adduser').send(newUser);
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username already exists, please choose another one');
    });

    // Test para cubrir el catch de /adduser (error genérico, p.ej., DB save)
    it('should return 400 on database save error', async () => {
        const newUser = { username: 'dberroruser', password: process.env.MYSQL_PASSWORD || 'password' };
        // Simula un error durante el save
        const saveSpy = jest.spyOn(User.prototype, 'save').mockImplementationOnce(() => Promise.reject(new Error('Simulated DB Save Error')));
        const response = await request(app).post('/adduser').send(newUser);
        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Simulated DB Save Error');
        saveSpy.mockRestore(); // Siempre restaura el spy
    });
  });

  describe('GET /user/:username', () => {
    it('should get user data successfully', async () => {
      const userData = { username: 'getuser', password: PWD_USER_GET };
       // Usa User.create para insertar directamente y aislar
      await User.create({ username: userData.username, password: await bcrypt.hash(userData.password, 10) });

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

     // Test para cubrir el catch de GET /user/:username (error genérico, p.ej., DB find)
    it('should return 500 on database find error', async () => {
        const findOneSpy = jest.spyOn(User, 'findOne').mockImplementationOnce(() => Promise.reject(new Error('Simulated DB Find Error')));
        const response = await request(app).get('/user/anyuser');
        expect(response.status).toBe(500);
        expect(response.body.error).toContain('Error fetching user data');
        expect(response.body.details).toContain('Simulated DB Find Error');
        findOneSpy.mockRestore();
    });
  });

  describe('PUT /user/:username/profile', () => {
    let testUsername = 'profileuser';

    beforeEach(async () => {
      // Crea el usuario directamente en la DB para cada test de este bloque
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

    // Test para cubrir el catch de PUT /user/:username/profile (error genérico, p.ej., DB update)
    it('should return 500 on database update error', async () => {
        const newProfileImage = 'profile_6.gif';
        const findOneAndUpdateSpy = jest.spyOn(User, 'findOneAndUpdate').mockImplementationOnce(() => Promise.reject(new Error('Simulated DB Update Error')));
        const response = await request(app)
          .put(`/user/${testUsername}/profile`)
          .send({ profileImage: newProfileImage });
        expect(response.status).toBe(500);
        expect(response.body.error).toContain('Error updating profile image');
        expect(response.body.details).toContain('Simulated DB Update Error');
        findOneAndUpdateSpy.mockRestore();
    });
  });

});

describe('User Service - Stats Endpoints', () => {

  describe('POST /api/stats', () => {
    it('should save game statistics successfully', async () => {
      const statsData = {
        username: "statsuser", score: 150, correctAnswers: 15,
        incorrectAnswers: 5, totalRounds: 20
      };
      const response = await request(app).post('/api/stats').send(statsData);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('username', 'statsuser');
      expect(response.body).toHaveProperty('score', 150);
      expect(response.body).toHaveProperty('accuracy', 75);

      const savedStats = await GameStats.findOne({ username: 'statsuser' });
      expect(savedStats).not.toBeNull();
      expect(savedStats.score).toBe(150);
      expect(savedStats.accuracy).toBe(75);
    });

    it('should calculate accuracy as 0 if correctAnswers is 0', async () => {
        const statsData = {
          username: "statsuserZero", score: 0, correctAnswers: 0,
          incorrectAnswers: 10, totalRounds: 10
        };
        const response = await request(app).post('/api/stats').send(statsData);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('accuracy', 0);
        const savedStats = await GameStats.findOne({ username: 'statsuserZero' });
        expect(savedStats.accuracy).toBe(0);
    });

    it('should return 400 if required fields are missing', async () => {
      const requiredFields = ['username', 'score', 'correctAnswers', 'incorrectAnswers', 'totalRounds'];
      const baseData = { username: "statsuser", score: 100, correctAnswers: 10, incorrectAnswers: 0, totalRounds: 10 };
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

    // Test para cubrir el catch de POST /api/stats (error genérico, p.ej., DB save)
    it('should return 500 on database save error', async () => {
       const statsData = { username: "dberrorstats", score: 10, correctAnswers: 1, incorrectAnswers: 1, totalRounds: 2 };
       const saveSpy = jest.spyOn(GameStats.prototype, 'save').mockImplementationOnce(() => Promise.reject(new Error('Simulated Stats Save Error')));
       const response = await request(app).post('/api/stats').send(statsData);
       expect(response.status).toBe(500);
       expect(response.body.error).toBe('Internal Server Error');
       expect(response.body.message).toContain('Simulated Stats Save Error');
       saveSpy.mockRestore();
    });
  });

  describe('GET /api/stats', () => {
    const user1 = 'statsgetter1';
    const user2 = 'statsgetter2';

    beforeEach(async () => {
      const now = Date.now();
      // Inserta datos con timestamps para probar ordenación
      // Asegúrate que tu game-stats-model.js TENGA el campo timestamp si quieres ordenarlo
      await GameStats.insertMany([
        { username: user1, score: 100, correctAnswers: 10, incorrectAnswers: 0, totalRounds: 10, accuracy: 100, timestamp: new Date(now - 10000) }, // Más viejo
        { username: user1, score: 80, correctAnswers: 8, incorrectAnswers: 2, totalRounds: 10, accuracy: 80, timestamp: new Date(now) }, // Más nuevo
        { username: user2, score: 120, correctAnswers: 12, incorrectAnswers: 3, totalRounds: 15, accuracy: 80, timestamp: new Date(now - 5000) }
      ]);
    });

    it('should return an empty array if user has no stats', async () => {
      const response = await request(app).get('/api/stats').query({ username: 'nouserstats' });
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 400 if username query parameter is missing', async () => {
      const response = await request(app).get('/api/stats'); // Sin query param
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('Falta el parámetro requerido: username');
    });

     // Test para cubrir el catch de GET /api/stats (error genérico, p.ej., DB find)
    it('should return 500 on database find error', async () => {
        const findSpy = jest.spyOn(GameStats, 'find').mockImplementationOnce(() => ({
            sort: jest.fn().mockImplementationOnce(() => Promise.reject(new Error('Simulated Stats Find Error'))) // Mockea la cadena find().sort()
        }));
        const response = await request(app).get('/api/stats').query({ username: user1 });
        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Internal Server Error');
        expect(response.body.message).toContain('Simulated Stats Find Error');
        findSpy.mockRestore();
    });
  });

  describe('GET /ranking', () => {
     beforeEach(async () => {
       const hashedPassword = await bcrypt.hash(PWD_RANK_USER, 10);
       await User.insertMany([
         { username: 'rankuser1', password: hashedPassword, profileImage: 'profile_3.gif' },
         { username: 'rankuser2', password: hashedPassword }, // Usa imagen por defecto
         { username: 'rankuser3', password: hashedPassword }  // Para el usuario rankuser3 que solo tiene stats
       ]);

       await GameStats.insertMany([
         { username: 'rankuser1', score: 100, correctAnswers: 10, incorrectAnswers: 0, totalRounds: 10, accuracy: 100 },
         { username: 'rankuser2', score: 50, correctAnswers: 5, incorrectAnswers: 5, totalRounds: 10, accuracy: 50 },
         { username: 'rankuser1', score: 150, correctAnswers: 15, incorrectAnswers: 5, totalRounds: 20, accuracy: 75 }, // Max score para user1
         { username: 'rankuser3', score: 120, correctAnswers: 12, incorrectAnswers: 3, totalRounds: 15, accuracy: 80 }
       ]);
     });

    it('should return ranking sorted by max score descending', async () => {
      const response = await request(app).get('/ranking');
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(3); // rankuser1, rankuser3, rankuser2

      expect(response.body[0]).toEqual({ username: 'rankuser1', score: 150, profileImage: 'profile_3.gif' });
      expect(response.body[1]).toEqual({ username: 'rankuser3', score: 120, profileImage: 'profile_1.gif' }); // Imagen por defecto
      expect(response.body[2]).toEqual({ username: 'rankuser2', score: 50, profileImage: 'profile_1.gif' }); // Imagen por defecto
    });

    it('should return an empty array if no stats exist', async () => {
      await GameStats.deleteMany({}); // Elimina solo las stats
      const response = await request(app).get('/ranking');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

     // Test para cubrir el catch de GET /ranking (error genérico, p.ej., DB aggregate)
    it('should return 500 on database aggregate error', async () => {
        const aggregateSpy = jest.spyOn(GameStats, 'aggregate').mockImplementationOnce(() => Promise.reject(new Error('Simulated Aggregate Error')));
        const response = await request(app).get('/ranking');
        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Failed to fetch ranking data');
        expect(response.body.details).toContain('Simulated Aggregate Error');
        aggregateSpy.mockRestore();
    });
  });

});