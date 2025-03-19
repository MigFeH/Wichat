const mongoose = require('mongoose');

const gameStatsSchema = new mongoose.Schema({
    username: { type: String, required: true },
    score: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    incorrectAnswers: { type: Number, required: true },
    totalRounds: { type: Number, required: true },
});

const GameStats = mongoose.model('GameStats', gameStatsSchema);

module.exports = GameStats;