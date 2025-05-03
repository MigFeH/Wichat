import { useState, useEffect, useRef, React } from 'react';
import QuestionGeneration from "../wikidataComponents/QuestionGeneration";

const useGameLogic = () => {
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [currentCity, setCurrentCity] = useState(null);
    const chatRef = useRef(); // Crear una referencia para ChatLLM

    // Crear el generador de preguntas y pasar showChat
    const [questionGenerator] = useState(() => 
        new QuestionGeneration(setCurrentQuestion)
    );

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
        currentCity,
        chatRef
    };
};

export default useGameLogic;