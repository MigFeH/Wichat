import { useState, useEffect } from 'react';
import QuestionGeneration from "../wikidataComponents/QuestionGeneration";

const useGameLogic = () => {
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questionGenerator] = useState(() => new QuestionGeneration(setCurrentQuestion));
    const [currentCity, setCurrentCity] = useState(null);

    useEffect(() => {
        questionGenerator.fetchQuestions();
    }, [questionGenerator]);

    useEffect(() => {
        console.log("Current question:", currentQuestion);
        if (currentQuestion) {
            setCurrentCity(currentQuestion.correct);
        }
    }, [currentQuestion]);

    return {
        currentQuestion,
        questionGenerator,
        currentCity
    };
};

export default useGameLogic;