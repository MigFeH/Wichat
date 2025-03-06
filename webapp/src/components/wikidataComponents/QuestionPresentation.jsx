import React, { useState, useEffect } from "react";

const QuestionPresentation = ({ game, navigate }) => {
    const [question, setQuestion] = useState({ answers: {}, correct: "" });
    const [score, setScore] = useState({ correct: 0, incorrect: 0, rounds: 0 });
    const [feedback, setFeedback] = useState(null);
    const [buttonsDisabled, setButtonsDisabled] = useState(false);
    const maxRounds = 10;

    useEffect(() => {
        game.setQuestion = setQuestion;
        game.fetchQuestions();
    }, []);

    const checkAnswer = (selected) => {
        const isCorrect = selected === question.correct;
        setFeedback(isCorrect ? "✅ Respuesta correcta" : "❌ Respuesta incorrecta");
        setButtonsDisabled(true);

        setScore((prev) => ({
            ...prev,
            correct: isCorrect ? prev.correct + 1 : prev.correct,
            incorrect: !isCorrect ? prev.incorrect + 1 : prev.incorrect,
            rounds: prev.rounds + 1
        }));

        setTimeout(() => {
            if (score.rounds + 1 < maxRounds) {
                game.fetchQuestions();
                setFeedback(null);
                setButtonsDisabled(false);
            }
        }, 1000);
    };

    if (score.rounds >= maxRounds) {
        return (
            <div>
                <h1>Resultados Finales</h1>
                <p>Respuestas correctas: {score.correct}</p>
                <p>Respuestas incorrectas: {score.incorrect}</p>
                <p>Ratio: {Math.round((score.correct / (score.correct + score.incorrect)) * 100)}%</p>
                <button onClick={() => navigate("/menu")}>Volver al menú principal</button>
            </div>
        );
    }

    return (
        <div>
            <h1>Adivina la Ciudad 🌍</h1>
            {question.correct && (
                <>
                    <img src={question.answers[question.correct]} alt="Ciudad" width="400" />
                    <div>
                        {Object.keys(question.answers).map((city) => (
                            <button
                                key={city}
                                onClick={() => checkAnswer(city)}
                                disabled={buttonsDisabled}
                            >
                                {city}
                            </button>
                        ))}
                    </div>
                    {feedback && <p>{feedback}</p>}
                </>
            )}
        </div>
    );
};

export default QuestionPresentation;

