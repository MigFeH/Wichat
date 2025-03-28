import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import useStats from '../utils/QuestionUtils';
import BaseQuestionPresentation from './BaseQuestionPresentation';
import { Typography } from '@mui/material';

const TimedQuestionPresentation = ({ game, navigate, question }) => {
    const { score, setScore, feedback, setFeedback, buttonsDisabled, setButtonsDisabled } = useStats(10);
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
            handleAnswer(false);
        }
    };

    const handleAnswer = (isCorrect) => {
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

    const checkAnswer = (selected) => {
        if (!question || buttonsDisabled) return;

        const isCorrect = selected === question.correct;
        setFeedback(isCorrect ? "✅ Correct answer" : "❌ Wrong answer");
        setButtonsDisabled(true);
        handleAnswer(isCorrect);
    };

    const getButtonClassName = (city) => {
        if (!buttonsDisabled) return 'answer-button';
        return `answer-button ${city === question.correct ? "correct" : "incorrect"}`;
    };

    return (
        <>
            <Typography 
                variant="body1" 
                className={`timer ${timer <= 3 ? 'timer-low' : 'timer-normal'}`}
            >
                ⏳ Tiempo restante: {timer}s
            </Typography>
            <BaseQuestionPresentation
                score={score}
                maxRounds={maxRounds}
                question={question}
                feedback={feedback}
                buttonsDisabled={buttonsDisabled}
                navigate={navigate}
                onAnswerClick={checkAnswer}
                getButtonClassName={getButtonClassName}
            />
        </>
    );
};

TimedQuestionPresentation.propTypes = {
    game: PropTypes.shape({
        fetchQuestions: PropTypes.func.isRequired
    }).isRequired,
    navigate: PropTypes.func.isRequired,
    question: PropTypes.shape({
        answers: PropTypes.objectOf(PropTypes.string),
        correct: PropTypes.string
    })
};

export default TimedQuestionPresentation;
