import React, { useState, useEffect } from "react";
import { Button } from '@mui/material';
import "./styles.css"; // Importa el archivo de estilos

const TimedQuestionPresentation = ({ game, navigate, question }) => {
    const [score, setScore] = useState({ correct: 0, incorrect: 0, rounds: 0 });
    const [feedback, setFeedback] = useState(null);
    const [buttonsDisabled, setButtonsDisabled] = useState(false);
    const [timer, setTimer] = useState(10);
    const maxRounds = 10;

    useEffect(() => {
        if (!question) return;

        setTimer(10);

        const countdown = setInterval(() => {
            setTimer(prev => {
                if (prev === 1) {
                    clearInterval(countdown);
                    handleTimeout();
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdown);
    }, [question]);

    const handleTimeout = () => {
        if (!buttonsDisabled) {
            setFeedback("⏳ Time's over ❌ wrong answer");
            setButtonsDisabled(true);

            setScore(prev => ({
                ...prev,
                incorrect: prev.incorrect + 1,
                rounds: prev.rounds + 1
            }));

            setTimeout(() => {
                if (score.rounds + 1 < maxRounds) {
                    game.fetchQuestions();
                    setFeedback(null);
                    setButtonsDisabled(false);
                }
            }, 1500);
        }
    };

    return (
        <div className="container">
            <h1>Guess the City 🌍</h1>
            <p className={`timer ${timer <= 3 ? "timer-low" : ""}`}>⏳ Tiempo restante: {timer}s</p>
            {question ? (
                <>
                    <div className="image-container">
                        <img
                            src={question.answers[question.correct]}
                            alt="Ciudad"
                            className="city-image"
                            onError={(e) => {
                                e.target.src = 'fallback-image-url';
                                e.target.alt = 'Imagen no disponible';
                            }}
                        />
                    </div>
                    <div className="button-grid">
                        {Object.keys(question.answers).map((city) => (
                            <button
                                key={city}
                                onClick={() => checkAnswer(city)}
                                disabled={buttonsDisabled}
                                className={`answer-button ${buttonsDisabled ? (city === question.correct ? "correct" : "incorrect") : ""}`}
                            >
                                {city}
                            </button>
                        ))}
                    </div>
                    {feedback && <p className="feedback">{feedback}</p>}
                </>
            ) : (
                <p className="feedback">Loading Question...</p>
            )}
        </div>
    );
};

export default TimedQuestionPresentation;
