import mongoose from 'mongoose';

const gameStatsSchema = new mongoose.Schema({
  correctAnswers: { type: Number, required: true },
  incorrectAnswers: { type: Number, required: true },
  totalRounds: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('GameStats', gameStatsSchema, 'gamedb');