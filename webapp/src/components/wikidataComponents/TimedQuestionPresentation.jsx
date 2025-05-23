import React, { useState, useEffect, useCallback } from "react";
import PropTypes from 'prop-types';
import useStats from '../utils/QuestionUtils';
import BaseQuestionPresentation from './BaseQuestionPresentation';
import { Typography } from '@mui/material';

const TimedQuestionPresentation = ({ game, navigate, question }) => {
    const { score, setScore, feedback, setFeedback, buttonsDisabled, setButtonsDisabled } = useStats(10);
    const [timer, setTimer] = useState(10);
    const maxRounds = 10;

    const handleAnswer = useCallback((isCorrect) => {
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
    }, [game, score.rounds, maxRounds, setFeedback, setButtonsDisabled, setScore]);

    const handleTimeout = useCallback(() => {
        if (!buttonsDisabled) {
            setFeedback("⏳ Time's over ❌ wrong answer");
            setButtonsDisabled(true);
            handleAnswer(false);
        }
    }, [buttonsDisabled, setFeedback, setButtonsDisabled, handleAnswer]);

    const checkAnswer = useCallback((selected) => {
        if (!question || buttonsDisabled) return;

        const isCorrect = selected === question.correct;
        setFeedback(isCorrect ? "✅ Correct answer" : "❌ Wrong answer");
        setButtonsDisabled(true);
        handleAnswer(isCorrect);
    }, [question, buttonsDisabled, setFeedback, setButtonsDisabled, handleAnswer]);

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
    }, [question, handleTimeout]);

    const getButtonClassName = useCallback((city) => {
        if (!buttonsDisabled) return 'answer-button';
        return `answer-button ${city === question.correct ? "correct" : "incorrect"}`;
    }, [buttonsDisabled, question]);

    return (
        <>
            <Typography 
                variant="p" 
                className={`timer ${timer <= 3 ? 'timer-low' : ''}`}
                sx={{
                    whiteSpace: 'nowrap',
                    display: 'inline-block'
                }}
            >
                {`⏳ Time remaining: ${timer}s`}
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
