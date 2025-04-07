import { useState, useEffect } from 'react';
import QuestionGeneration from "../wikidataComponents/QuestionGeneration";

const useGameLogic = (showChat) => { // Aceptar showChat como argumento
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questionGenerator] = useState(() => new QuestionGeneration(setCurrentQuestion, showChat)); // Pasar showChat
    const [currentCity, setCurrentCity] = useState(null);

    useEffect(() => {
        questionGenerator.fetchQuestions();
    }, [questionGenerator]);

    useEffect(() => {
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