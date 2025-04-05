const request = require('supertest');
const bcrypt = require('bcrypt');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('./user-model');
const GameStats = require('./game-stats-model');

let mongoServer;
let app;
let server; // Guardar la referencia al servidor para cerrarlo correctamente

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  // Importar y guardar la instancia del servidor
  server = require('./user-service');
  app = server; // Usar la instancia del servidor para las peticiones
});

afterAll(async () => {
  // Usar la referencia guardada para cerrar
  if (server) {
    await server.close();
  }
  await mongoServer.stop();
});

// Limpiar las colecciones antes de cada test
beforeEach(async () => {
  await User.deleteMany({});
  await GameStats.deleteMany({});
});


describe('User Service - Authentication & User Management', () => {

  it('should add a new user on POST /adduser', async () => {
    const newUser = {
      username: 'testuser',
      password: 'testpassword',
    };

    const response = await request(app).post('/adduser').send(newUser);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'testuser');
    // Verificar que la contraseña no está en la respuesta
    expect(response.body).not.toHaveProperty('password');
    // Verificar que la imagen de perfil por defecto está en la respuesta
    expect(response.body).toHaveProperty('profileImage', 'profile_1.gif');

    const userInDb = await User.findOne({ username: 'testuser' });
    expect(userInDb).not.toBeNull();
    expect(userInDb.username).toBe('testuser');
    // Verificar la imagen de perfil por defecto en la BD
    expect(userInDb.profileImage).toBe('profile_1.gif');

    const isPasswordValid = await bcrypt.compare('testpassword', userInDb.password);
    expect(isPasswordValid).toBe(true);
  });

  it('should return 400 if username already exists on POST /adduser', async () => {
    const userData = { username: 'existinguser', password: 'password123' };
    // Crear usuario primero
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    await new User({ username: userData.username, password: hashedPassword }).save();

    // Intentar crear de nuevo
    const response = await request(app).post('/adduser').send(userData);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Username already exists, please choose another one');
  });


  it('should return a 400 error if missing required fields on POST /adduser', async () => {
    const newUser = {
      username: 'testuser', // Falta password
    };

    const response = await request(app).post('/adduser').send(newUser);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing required field: password');
  });

  it('should get user data on GET /user/:username', async () => {
    const userData = { username: 'getuser', password: 'password123', profileImage: 'profile_2.gif' };
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    await new User({ username: userData.username, password: hashedPassword, profileImage: userData.profileImage }).save();

    const response = await request(app).get(`/user/${userData.username}`);
    expect(response.status).toBe(200);
    expect(response.body.username).toBe(userData.username);
    expect(response.body.profileImage).toBe(userData.profileImage);
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).toHaveProperty('createdAt'); // Asumiendo que el timestamp está
  });

  it('should return 404 on GET /user/:username if user not found', async () => {
    const response = await request(app).get('/user/nonexistentuser');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found');
  });

  it('should update profile image on PUT /user/:username/profile', async () => {
      const userData = { username: 'updateuser', password: 'password123' };
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await new User({ username: userData.username, password: hashedPassword }).save(); // Usa default profile_1.gif

      const newProfileImage = { profileImage: 'profile_5.gif' };
      const response = await request(app)
          .put(`/user/${userData.username}/profile`)
          .send(newProfileImage);

      expect(response.status).toBe(200);
      expect(response.body.username).toBe(userData.username);
      expect(response.body.profileImage).toBe(newProfileImage.profileImage);
      expect(response.body).not.toHaveProperty('password');

      const userInDb = await User.findOne({ username: userData.username });
      expect(userInDb.profileImage).toBe(newProfileImage.profileImage);
  });

  it('should return 400 on PUT /user/:username/profile with invalid image name', async () => {
      const userData = { username: 'updateuserinvalid', password: 'password123' };
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await new User({ username: userData.username, password: hashedPassword }).save();

      const invalidProfileImage = { profileImage: 'invalid_image_format.jpg' };
      const response = await request(app)
          .put(`/user/${userData.username}/profile`)
          .send(invalidProfileImage);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid profile image name provided');
  });

    it('should return 400 on PUT /user/:username/profile with non-allowed image name', async () => {
      const userData = { username: 'updateusernotallowed', password: 'password123' };
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await new User({ username: userData.username, password: hashedPassword }).save();

      const nonAllowedImage = { profileImage: 'profile_9.gif' }; // Assuming only 1-8 are allowed
      const response = await request(app)
          .put(`/user/${userData.username}/profile`)
          .send(nonAllowedImage);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Selected profile image is not valid');
  });

  it('should return 404 on PUT /user/:username/profile if user not found', async () => {
      const response = await request(app)
          .put('/user/nonexistentuser/profile')
          .send({ profileImage: 'profile_2.gif' });
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
  });

});


describe('User Service - Game Statistics & Ranking', () => {

  // Pre-crear un usuario para las pruebas de stats/ranking
  beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('statspassword', 10);
      await new User({ username: 'statsuser', password: hashedPassword, profileImage: 'profile_3.gif' }).save();
      await new User({ username: 'statsuser2', password: hashedPassword, profileImage: 'profile_4.gif' }).save();
  });

  it('should handle missing fields correctly on POST /api/stats', async () => {
    const response = await request(app).post('/api/stats').send({});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    expect(response.body.message).toBe('Faltan campos requeridos: username, score, correctAnswers, incorrectAnswers, totalRounds');
  });

  it('should save game statistics on POST /api/stats', async () => {
    const statsData = {
      username: "statsuser",
      score: 8,
      correctAnswers: 8,
      incorrectAnswers: 2,
      totalRounds: 10
    };

    const response = await request(app).post('/api/stats').send(statsData);
    expect(response.status).toBe(201);
    expect(response.body.username).toBe(statsData.username);
    expect(response.body.score).toBe(statsData.score);
    expect(response.body.correctAnswers).toBe(statsData.correctAnswers);
    expect(response.body.accuracy).toBe(80);

    const savedStats = await GameStats.findOne({ username: "statsuser", score: 8 });
    expect(savedStats).not.toBeNull();
    expect(savedStats.accuracy).toBe(80);
  });

  it('should get game statistics for a user on GET /api/stats', async () => {
    // Guardar algunas estadísticas primero
    await new GameStats({ username: "statsuser", score: 5, correctAnswers: 5, incorrectAnswers: 5, totalRounds: 10, accuracy: 50 }).save();
    await new GameStats({ username: "statsuser", score: 9, correctAnswers: 9, incorrectAnswers: 1, totalRounds: 10, accuracy: 90 }).save();
    await new GameStats({ username: "statsuser2", score: 7, correctAnswers: 7, incorrectAnswers: 3, totalRounds: 10, accuracy: 70 }).save();


    const response = await request(app).get('/api/stats').query({ username: "statsuser" });
    expect(response.status).toBe(200);
    // Debería devolver las estadísticas del usuario ordenadas por tiempo (más recientes primero)
    expect(response.body.length).toBe(2);
    expect(response.body[0]).toHaveProperty('username', 'statsuser');
    expect(response.body[0]).toHaveProperty('score', 9);
    expect(response.body[0]).toHaveProperty('accuracy', 90);
    expect(response.body[1]).toHaveProperty('score', 5);
    expect(response.body[1]).toHaveProperty('accuracy', 50);
  });

   it('should return 400 on GET /api/stats if username query param is missing', async () => {
    const response = await request(app).get('/api/stats'); // Sin query param
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
    expect(response.body.message).toBe('Falta el parámetro requerido: username');
  });

  it('should get the ranking on GET /ranking', async () => {
     // Guardar algunas estadísticas para diferentes usuarios
    await new GameStats({ username: "statsuser", score: 5, correctAnswers: 5, incorrectAnswers: 5, totalRounds: 10, accuracy: 50 }).save();
    await new GameStats({ username: "statsuser", score: 9, correctAnswers: 9, incorrectAnswers: 1, totalRounds: 10, accuracy: 90 }).save(); // Max score for statsuser is 9
    await new GameStats({ username: "statsuser2", score: 7, correctAnswers: 7, incorrectAnswers: 3, totalRounds: 10, accuracy: 70 }).save(); // Max score for statsuser2 is 7

    const response = await request(app).get('/ranking');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(2);

    // Verificar orden y contenido
    expect(response.body[0]).toHaveProperty('username', 'statsuser');
    expect(response.body[0]).toHaveProperty('score', 9);
    expect(response.body[0]).toHaveProperty('profileImage', 'profile_3.gif'); // Imagen de statsuser

    expect(response.body[1]).toHaveProperty('username', 'statsuser2');
    expect(response.body[1]).toHaveProperty('score', 7);
    expect(response.body[1]).toHaveProperty('profileImage', 'profile_4.gif'); // Imagen de statsuser2
  });

   it('should return an empty array on GET /ranking if no stats exist', async () => {
    // No se guardan estadísticas
    const response = await request(app).get('/ranking');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(0);
  });

});