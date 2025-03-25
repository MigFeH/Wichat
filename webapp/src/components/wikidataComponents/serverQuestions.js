const express = require('express');
const cors = require('cors');
const QuestionGeneration = require('./QuestionGeneration');

const app = express();
const port = 8004;

app.use(cors());
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
    } catch (error) {
        res.status(500).json({ error: "Error generating questions" });
    }
});

// Iniciar el servicio
app.listen(port, () => {
    console.log(`Question Service running on http://localhost:${port}`);
});
