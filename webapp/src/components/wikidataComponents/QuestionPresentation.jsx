import React, { useState, useEffect } from "react";
import { Button } from '@mui/material';
import "estilo.css";
import PropTypes from 'prop-types';

const QuestionPresentation = ({ game, navigate, question }) => {
    const [score, setScore] = useState({ correct: 0, incorrect: 0, rounds: 0 });
    const [feedback, setFeedback] = useState(null);
    const [buttonsDisabled, setButtonsDisabled] = useState(false);
    const maxRounds = 10;

    useEffect(() => {
        const saveStats = async () => {
        try {
            const response = await fetch('http://localhost:8001/api/stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: localStorage.getItem('username'),
                    score:score.correct,
                    correctAnswers: score.correct,
                    incorrectAnswers: score.incorrect,
                    totalRounds: maxRounds
                })
            });
            
            if (!response.ok) throw new Error('Error al guardar estadísticas');
            
        } catch (error) {
            console.error('Error:', error);
        }
        };

        if (score.rounds >= maxRounds) saveStats();
    }, [score,maxRounds]);

    const checkAnswer = (selected) => {
        if (!question || buttonsDisabled) return;

        const isCorrect = selected === question.correct;
        setFeedback(isCorrect ? "✅ Correct answer" : "❌ Wrong answer");
        setButtonsDisabled(true);

        setScore(prev => ({
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
        }, 1500);
    };

    if (score.rounds >= maxRounds) {
        const total = score.correct + score.incorrect;
        const ratio = total > 0 ? Math.round((score.correct / total) * 100) : 0;

        return (
            <div>
                <h1>Final results</h1>
                <p>Correct answers: {score.correct}</p>
                <p>Incorrect answers: {score.incorrect}</p>
                <p>Ratio: {ratio}%</p>
                <Button variant="contained" color="primary" onClick={() => navigate("/menu")}>
                    Back to menu
                </Button>
            </div>
        );
    }

    return (
        <div>
            <h1>Guess the city 🌍</h1>
            {question ? (
                <>
                    <div style={{ margin: '20px 0' }}>
                        <img 
                            src={question.answers[question.correct]} 
                            alt="Ciudad"
                            onError={(e) => {
                                e.target.src = 'fallback-image-url';
                                e.target.alt = 'Imagen no disponible';
                            }}
                        />
                    </div>
                    <div >
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
                    {feedback && <p>{feedback}</p>}
                </>
            ) : (
                <p>Loading question...</p>
            )}
        </div>
    );
};

QuestionPresentation.propTypes = {
    game: PropTypes.shape({
        fetchQuestions: PropTypes.func.isRequired
    }),
    navigate: PropTypes.func,
    question: PropTypes.shape({
        answers: PropTypes.objectOf(PropTypes.string),
        correct: PropTypes.string
    })
};

QuestionPresentation.defaultProps = {
    game: {
        fetchQuestions: () => {}
    },
    navigate: () => {},
    question: null
};

export default QuestionPresentation;