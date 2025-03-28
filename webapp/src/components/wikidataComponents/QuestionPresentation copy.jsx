import React from "react";
import { Button } from '@mui/material';
import "../style/estilo.css";
import PropTypes from 'prop-types';
import useStats from '../utils/QuestionUtils';

const QuestionPresentation = ({ game, navigate, question }) => {
    const { score, setScore, feedback, setFeedback, buttonsDisabled, setButtonsDisabled } = useStats(10);
    const maxRounds = 10;

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

    const getButtonClassName = (city) => {
        if (!buttonsDisabled) return 'answer-button';
        return `answer-button ${city === question.correct ? "correct" : "incorrect"}`;
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
            <h1>Guess the City 🌍</h1>
            {question ? (
                <>
                    <div className="image-container">
                        <img
                            className="city-image"
                            src={question.answers[question.correct]}
                            alt="Ciudad"
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
                                className={getButtonClassName(city)}
                            >
                                {city}
                            </button>
                        ))}
                    </div>
                    {feedback && <p>{feedback}</p>}
                </>
            ) : (
                <p className="loading-question">Loading Question...</p>
            )}
        </div>
    );
};

QuestionPresentation.propTypes = {
    game: PropTypes.shape({
        fetchQuestions: PropTypes.func.isRequired
    }).isRequired,
    navigate: PropTypes.func.isRequired,
    question: PropTypes.shape({
        answers: PropTypes.objectOf(PropTypes.string),
        correct: PropTypes.string
    })
};

QuestionPresentation.defaultProps = {
    question: null
};

export default QuestionPresentation;