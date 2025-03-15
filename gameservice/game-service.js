import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import GameStats from './models/game-stats-model.js';

const app = express();
const port = process.env.PORT || 8010;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamedb';
mongoose.connect(mongoUri)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error de conexión a MongoDB:', err.message));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    dbState: mongoose.STATES[mongoose.connection.readyState],
    timestamp: new Date().toISOString()
  });
});

app.post('/api/stats', async (req, res) => {
  try {
    const { correctAnswers, incorrectAnswers, totalRounds } = req.body; // Usar los nombres del modelo
    
    if (!correctAnswers || !incorrectAnswers || !totalRounds) {
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'Faltan campos requeridos: correctAnswers, incorrectAnswers, totalRounds'
      });
    }

    const newStats = new GameStats({
      correctAnswers,
      incorrectAnswers,
      totalRounds,
      accuracy: parseFloat(((correctAnswers / totalRounds) * 100).toFixed(2))
    });

    const savedStats = await newStats.save();
    res.status(201).json(savedStats);
    
  } catch (error) {
    console.error('Error guardando estadísticas:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const stats = await GameStats.find()
      .sort({ timestamp: -1 })
      .limit(limit);
      
    res.json(stats);
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

const server = app.listen(port, () => {
  console.log(` Servidor de estadísticas ejecutándose en puerto ${port}`);
  console.log(` MongoDB URI: ${mongoUri}`);
});

server.on('close', () => {
  mongoose.connection.close();
});