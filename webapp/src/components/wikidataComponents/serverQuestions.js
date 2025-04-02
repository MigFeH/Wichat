const express = require('express');
const cors = require('cors');
const QuestionGeneration = require('./QuestionGeneration');

const app = express();
const port = 8004;

// Configure CORS with specific options
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:8004',
  methods: ['GET'], // Allow only GET requests
  allowedHeaders: ['Content-Type'],
  maxAge: 600 // Cache preflight request results for 10 minutes (600 seconds)
};

app.use(cors(corsOptions));
app.use(express.json());

const questionGenerator = new QuestionGeneration(() => {});

// Endpoint para obtener una pregunta
app.get('/questions', async (req, res) => {
    try {
        await questionGenerator.fetchQuestions();
        const question = questionGenerator.getNextQuestion();

        if (!question) {
            return res.status(404).json({ error: "No questions available" });
        }

        res.json(question);
        return res.status(200);
    } catch (error) {
        res.status(500).json({ error: "Error generating questions" });
    }
});

// Iniciar el servicio
app.listen(port, () => {
    console.log(`Question Service running on http://localhost:${port}`);
});
